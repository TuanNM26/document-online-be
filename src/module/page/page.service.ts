import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { Page, PageDocument } from './page.schema';
import { CreatePageDto } from './dto/createPage.dto';
import { UpdatePageDto } from './dto/updatePage.dto';
import { Document, DocumentDocument } from '../document/document.schema';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../common/storage/supabase';
import { DocumentGateway } from '../document/document.gateway';
import { MESSAGES } from '../../common/constant/message';
import { ALLOWED_TYPES_MAP } from 'src/common/constant/allowedFileType';
import { ResponsePageDto } from './dto/responsePage.dto';
import { plainToInstance } from 'class-transformer';
import {
  paginate,
  PaginationResult,
} from 'src/common/interface/pagination.interface';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import { Type } from '@aws-sdk/client-s3';

const DOCOLINE = 'doconline';
@Injectable()
export class PageService {
  constructor(
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private documentGateway: DocumentGateway,
  ) {}

  async addPagesToDocument(
    documentId: string,
    file: Express.Multer.File,
  ): Promise<ResponsePageDto[]> {
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException(MESSAGES.DOCUMENT_NOT_FOUND);
    }

    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf') {
      throw new BadRequestException('Chỉ hỗ trợ thêm trang từ file .pdf');
    }

    const pdfDoc = await PDFDocument.load(file.buffer);
    const numNewPages = pdfDoc.getPages().length;

    const existingPages = await this.pageModel
      .find({ documentId: new Types.ObjectId(documentId) })
      .sort({ pageNumber: 1 });

    const currentPageCount = existingPages.length;

    const newPages: Partial<Page>[] = [];

    for (let i = 0; i < numNewPages; i++) {
      const newPageDoc = await PDFDocument.create();
      const [copiedPage] = await newPageDoc.copyPages(pdfDoc, [i]);
      newPageDoc.addPage(copiedPage);
      const newPageBytes = await newPageDoc.save();

      const pageFileName = `documents/${document._id}/pages/page_${currentPageCount + i + 1}.pdf`;

      const { error } = await supabase.storage
        .from('doconline')
        .upload(pageFileName, Buffer.from(newPageBytes), {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(
          `Upload trang mới thất bại: ${error.message}`,
        );
      }

      const { data: urlData } = supabase.storage
        .from('doconline')
        .getPublicUrl(pageFileName);
      console.log(currentPageCount);
      newPages.push({
        documentId: document._id as Types.ObjectId,
        pageNumber: currentPageCount + i + 1,
        filePath: urlData.publicUrl,
        fileType: 'pdf',
      });
    }

    const insertedPages = await this.pageModel.insertMany(newPages);

    document.totalPages = currentPageCount + numNewPages;
    await document.save();

    return plainToInstance(
      ResponsePageDto,
      insertedPages.map((p) => p.toObject()),
      {
        excludeExtraneousValues: true,
      },
    );
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

  private validateFileType(
    documentFileType: string,
    file: Express.Multer.File,
  ) {
    const allowedTypes = ALLOWED_TYPES_MAP[documentFileType];
    if (!allowedTypes) {
      throw new BadRequestException(
        `Unsupported document file type: ${documentFileType}`,
      );
    }

    const fileExt = file.originalname.split('.').pop()?.toLowerCase() || '';
    const mimetype = file.mimetype.toLowerCase();

    const isValidType =
      allowedTypes.includes(fileExt) || allowedTypes.includes(mimetype);
    if (!isValidType) {
      throw new BadRequestException(
        `File type mismatch. Only ${documentFileType} files are allowed.`,
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    q?: string,
  ): Promise<PaginationResult<ResponsePageDto>> {
    const filter = q ? { documentId: new Types.ObjectId(q) } : {};

    const result = await paginate(
      this.pageModel,
      page,
      limit,
      filter,
      { pageNumber: 1 },
      [{ path: 'documentId', select: 'title field' }],
    );

    return {
      ...result,
      data: plainToInstance(ResponsePageDto, result.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findOne(id: string): Promise<ResponsePageDto> {
    const page = await this.pageModel
      .findById(id)
      .populate({ path: 'documentId', select: 'title field' });
    if (!page) throw new NotFoundException(MESSAGES.PAGE_NOT_FOUND);
    return plainToInstance(ResponsePageDto, page.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async updatePageFile(
    id: string,
    file: Express.Multer.File,
  ): Promise<ResponsePageDto[]> {
    const page = await this.pageModel.findById(id);
    if (!page) {
      throw new NotFoundException('Trang không tồn tại');
    }

    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    const allowedTypes: Record<string, string[]> = {
      pdf: ['pdf'],
      txt: ['txt'],
      xlsx: ['xlsx', 'xls'],
    };

    const currentType = page.fileType?.toLowerCase();
    const isAllowed = allowedTypes[currentType]?.includes(fileExt || '');
    if (!isAllowed) {
      throw new BadRequestException(
        `Không thể cập nhật file .${fileExt}. Trang này chỉ chấp nhận cập nhật file ${allowedTypes[currentType]?.join(', ')}`,
      );
    }

    // Xóa file cũ khỏi Supabase
    if (page.filePath) {
      const oldFileName = page.filePath.split('/').slice(-1)[0];
      await supabase.storage
        .from('doconline')
        .remove([`documents/${page.documentId}/pages/${oldFileName}`]);
    }

    // Xóa page hiện tại
    await this.pageModel.findByIdAndDelete(page._id);

    // Định nghĩa biến sẽ chứa các page mới tạo
    const newPages: Partial<Page>[] = [];

    if (fileExt === 'pdf') {
      // Xử lý như cũ: phân tách PDF thành các page nhỏ
      const pdfDoc = await PDFDocument.load(file.buffer);
      const newPdfPages = pdfDoc.getPages();
      const numNewPages = newPdfPages.length;

      // Dịch các page phía sau
      const shiftAmount = numNewPages - 1;
      const nextPages = await this.pageModel
        .find({
          documentId: page.documentId,
          pageNumber: { $gt: page.pageNumber },
        })
        .sort({ pageNumber: 1 });

      for (const nextPage of nextPages) {
        nextPage.pageNumber += shiftAmount;
        await nextPage.save();
      }

      for (let i = 0; i < numNewPages; i++) {
        const newPageDoc = await PDFDocument.create();
        const [copiedPage] = await newPageDoc.copyPages(pdfDoc, [i]);
        newPageDoc.addPage(copiedPage);
        const newPageBytes = await newPageDoc.save();

        const pageFileName = `documents/${page.documentId}/pages/page_${page.pageNumber + i}-${uuidv4()}.pdf`;

        const { error } = await supabase.storage
          .from('doconline')
          .upload(pageFileName, Buffer.from(newPageBytes), {
            contentType: 'application/pdf',
            cacheControl: '3600',
          });

        if (error)
          throw new BadRequestException(`Tải file thất bại: ${error.message}`);

        const { data: urlData } = supabase.storage
          .from('doconline')
          .getPublicUrl(pageFileName);

        newPages.push({
          documentId: page.documentId,
          pageNumber: page.pageNumber + i,
          filePath: urlData.publicUrl,
          fileType: 'pdf',
        });
      }

      // Cập nhật totalPages
      const document = await this.documentModel.findById(page.documentId);
      if (document) {
        document.totalPages += shiftAmount;
        await document.save();
      }
    } else {
      // txt hoặc xlsx thì chỉ tạo 1 page mới duy nhất (không phân trang)
      const pageFileName = `documents/${page.documentId}/pages/page_${page.pageNumber}-${uuidv4()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('doconline')
        .upload(pageFileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (error)
        throw new BadRequestException(`Tải file thất bại: ${error.message}`);

      const { data: urlData } = supabase.storage
        .from('doconline')
        .getPublicUrl(pageFileName);

      newPages.push({
        documentId: page.documentId,
        pageNumber: page.pageNumber,
        filePath: urlData.publicUrl,
        fileType: fileExt,
      });

      // Không cần update totalPages vì chỉ thay đúng 1 page
    }

    // Lưu các page mới
    const inserted = await this.pageModel.insertMany(newPages);

    return plainToInstance(
      ResponsePageDto,
      inserted.map((p) => p.toObject()),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async remove(id: string) {
    const page = await this.pageModel.findById(id);
    if (!page) {
      throw new NotFoundException(MESSAGES.PAGE_NOT_FOUND);
    }

    const documentId = page.documentId;
    const deletedPageNumber = page.pageNumber;

    await this.pageModel.findByIdAndDelete(id);

    await this.documentModel.findByIdAndUpdate(documentId, {
      $inc: { totalPages: -1 },
    });

    await this.pageModel.updateMany(
      {
        documentId: documentId,
        pageNumber: { $gt: deletedPageNumber },
      },
      { $inc: { pageNumber: -1 } },
    );

    await this.documentGateway.notifyPageChange(
      documentId.toString(),
      'deleted',
    );

    return { message: 'Page deleted and page numbers updated' };
  }

  async findByDocumentId(documentId: string): Promise<ResponsePageDto[]> {
    const result = await this.pageModel
      .find({ documentId: new Types.ObjectId(documentId) })
      .populate({ path: 'documentId', select: 'title field' })
      .sort({ pageNumber: 1 })
      .exec();

    return plainToInstance(ResponsePageDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
