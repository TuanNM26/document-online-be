import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, DocumentDocument } from './document.schema';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { supabase } from 'src/common/storage/supabase';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { Page, PageDocument } from '../page/page.schema';
import { DocumentGateway } from './document.gateway';
import { MESSAGES } from 'src/common/constant/message';
import { UpdateDocumentDto } from './dto/updateDocument.dto';
import { ResponseDocumentDto } from './dto/responseDocument.dto';
import { plainToInstance } from 'class-transformer';
import {
  paginate,
  PaginationResult,
} from 'src/common/interface/pagination.interface';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,
    @InjectModel(Page.name)
    private readonly pageModel: Model<PageDocument>,
    private readonly documentGateway: DocumentGateway,
  ) {}

  async create(data: {
    title: string;
    field: string;
    file: Express.Multer.File;
    userId:string
  }): Promise<ResponseDocumentDto> {
    const { file, ...docInfo } = data;

    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      throw new BadRequestException('File extension is missing');
    }

    const fileName = `documents/${uuidv4()}.${fileExt}`;
    const { data: uploaded, error } = await supabase.storage
      .from('doconline')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('doconline')
      .getPublicUrl(fileName);
    const filePath = urlData.publicUrl;
    const totalPages = await this.analyzeFile(file);

    const newDoc = new this.documentModel({
      ...docInfo,
      filePath,
      fileType: fileExt,
      totalPages,
    });

    const pages = Array.from({ length: totalPages }, (_, i) => ({
      documentId: newDoc._id,
      pageNumber: i + 1,
      filePath: filePath,
      fileType: fileExt,
    }));

    await this.pageModel.insertMany(pages);

    const savedDoc = await newDoc.save();

    return plainToInstance(ResponseDocumentDto, savedDoc.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    searchQuery?: string,
  ): Promise<PaginationResult<ResponseDocumentDto>> {
    const filter = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { field: { $regex: searchQuery, $options: 'i' } },
            { author: { $regex: searchQuery, $options: 'i' } },
          ],
        }
      : {};

    const result = await paginate(this.documentModel, page, limit, filter, {
      createdAt: -1,
    });

    return {
      ...result,
      data: plainToInstance(ResponseDocumentDto, result.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findById(id: string): Promise<ResponseDocumentDto> {
    const doc = await this.documentModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    return plainToInstance(ResponseDocumentDto, doc.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    file?: Express.Multer.File,
  ): Promise<ResponseDocumentDto> {
    const document = await this.documentModel.findById(id);
    if (!document) {
      throw new NotFoundException(MESSAGES.DOCUMENT_NOT_FOUND);
    }

    if (file) {
      const fileExt = file.originalname.split('.').pop()?.toLowerCase();
      const allowedTypes = ['pdf', 'txt', 'xlsx'];
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        throw new BadRequestException(
          `Only .pdf, .txt, .xlsx files are allowed.`,
        );
      }

      const pages = await this.pageModel.find({ documentId: document._id });
      for (const page of pages) {
        if (page.filePath) {
          const pageFileName = page.filePath.split('/').pop();
          if (pageFileName) {
            await supabase.storage
              .from('doconline')
              .remove([`pages/${pageFileName}`]);
          }
        }
      }
      await this.pageModel.deleteMany({ documentId: document._id });

      if (document.filePath) {
        const oldFileName = document.filePath.split('/').slice(-1)[0];
        await supabase.storage
          .from('doconline')
          .remove([`documents/${oldFileName}`]);
      }

      const newFileName = `documents/document-${id}-${uuidv4()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('doconline')
        .upload(newFileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('doconline')
        .getPublicUrl(newFileName);

      const totalPages = await this.analyzeFile(file);

      document.filePath = urlData.publicUrl;
      document.fileType = fileExt;
      document.totalPages = totalPages;

      const newPages = Array.from({ length: totalPages }, (_, i) => ({
        documentId: document._id,
        pageNumber: i + 1,
        filePath: urlData.publicUrl,
        fileType: fileExt,
      }));
      await this.pageModel.insertMany(newPages);
    }

    Object.assign(document, dto);
    const saved = document.save();
    return plainToInstance(ResponseDocumentDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async delete(id: string): Promise<void> {
    const result = await this.documentModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    await this.pageModel.deleteMany({ documentId: result._id });
  }

  async analyzeFile(file: Express.Multer.File): Promise<number> {
    const mimetype = file.mimetype;

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.numpages;
    } else if (
      mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-excel'
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      return workbook.SheetNames.length;
    } else if (mimetype === 'text/plain') {
      const text = file.buffer.toString('utf-8').trim();
      if (!text) return 1;
      const charCount = text.length;
      const charsPerPage = 10000;
      return Math.ceil(charCount / charsPerPage);
    } else {
      throw new BadRequestException('Unsupported file type');
    }
  }
}
