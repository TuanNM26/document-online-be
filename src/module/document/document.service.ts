import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, DocumentDocument } from './document.schema';
import { Model, Types } from 'mongoose';
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
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';

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
    userId: string;
  }): Promise<ResponseDocumentDto> {
    const { file, ...docInfo } = data;
    const fileExt = path.extname(file.originalname)?.substring(1).toLowerCase();

    const pageEntities: Partial<Page>[] = [];
    let totalPages = 0;
    let originalFilePath: string;
    const nowTimestamp = Date.now();
    const newDocId = new Types.ObjectId(); // tạo trước để dùng trong upload

    // --- 1. Upload file gốc ---
    originalFilePath = `documents/${nowTimestamp}_${file.originalname}`;
    const { error: originalUploadError } = await supabase.storage
      .from('doconline')
      .upload(originalFilePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (originalUploadError) {
      throw new BadRequestException(
        `Tải file gốc thất bại: ${originalUploadError.message}`,
      );
    }

    const { data: originalUrlData } = supabase.storage
      .from('doconline')
      .getPublicUrl(originalFilePath);

    if (
      !originalUrlData?.publicUrl ||
      typeof originalUrlData.publicUrl !== 'string'
    ) {
      throw new BadRequestException('Không thể lấy publicUrl cho file gốc.');
    }

    // --- 2. Xử lý theo định dạng file ---
    if (fileExt === 'pdf') {
      const pdfDoc = await PDFDocument.load(file.buffer);
      const pages = pdfDoc.getPages();
      totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const singlePageDoc = await PDFDocument.create();
        const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
        singlePageDoc.addPage(copiedPage);
        const pdfBytes = await singlePageDoc.save();

        const pageFileName = `documents/${newDocId}/page_${i + 1}.pdf`;
        const { error } = await supabase.storage
          .from('doconline')
          .upload(pageFileName, Buffer.from(pdfBytes), {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (error) {
          throw new BadRequestException(
            `Upload page ${i + 1} thất bại: ${error.message}`,
          );
        }

        const { data: urlData } = supabase.storage
          .from('doconline')
          .getPublicUrl(pageFileName);

        pageEntities.push({
          documentId: newDocId,
          pageNumber: i + 1,
          filePath: urlData.publicUrl,
          fileType: 'pdf',
        });
      }
    } else if (fileExt === 'txt') {
      const text = file.buffer.toString('utf-8').trim();
      const charsPerPage = 100000;
      const totalChunks = Math.ceil(text.length / charsPerPage);

      for (let i = 0; i < totalChunks; i++) {
        const chunkText = text.slice(i * charsPerPage, (i + 1) * charsPerPage);

        const pageFileName = `documents/${newDocId}/page_${i + 1}.txt`;
        const { error } = await supabase.storage
          .from('doconline')
          .upload(pageFileName, Buffer.from(chunkText), {
            contentType: 'text/plain',
            upsert: false,
          });

        if (error) {
          throw new BadRequestException(
            `Upload TXT page ${i + 1} thất bại: ${error.message}`,
          );
        }

        const { data: urlData } = supabase.storage
          .from('doconline')
          .getPublicUrl(pageFileName);

        pageEntities.push({
          documentId: newDocId,
          pageNumber: i + 1,
          filePath: urlData.publicUrl,
          fileType: 'txt',
        });
      }

      totalPages = pageEntities.length;
    } else if (fileExt === 'xlsx') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      const rowsPerPage = 30;
      const totalChunks = Math.ceil(rows.length / rowsPerPage);

      for (let i = 0; i < totalChunks; i++) {
        const chunkRows = rows.slice(i * rowsPerPage, (i + 1) * rowsPerPage);
        const contentLines = chunkRows
          .map((row) => row.join(' | '))
          .filter((line) => line.trim() !== '');
        const pageContent = contentLines.join('\n');

        const pageFileName = `documents/${newDocId}/page_${i + 1}.txt`;
        const { error } = await supabase.storage
          .from('doconline')
          .upload(pageFileName, Buffer.from(pageContent), {
            contentType: 'text/plain',
            upsert: false,
          });

        if (error) {
          throw new BadRequestException(
            `Upload XLSX page ${i + 1} thất bại: ${error.message}`,
          );
        }

        const { data: urlData } = supabase.storage
          .from('doconline')
          .getPublicUrl(pageFileName);

        pageEntities.push({
          documentId: newDocId,
          pageNumber: i + 1,
          filePath: urlData.publicUrl,
          fileType: 'xlsx',
        });
      }

      totalPages = pageEntities.length;
    } else {
      throw new BadRequestException('Chỉ hỗ trợ file PDF, TXT hoặc XLSX.');
    }

    // --- 3. Tạo document ---
    const newDoc = new this.documentModel({
      ...docInfo,
      fileType: fileExt,
      totalPages,
      userId: data.userId,
      _id: newDocId,
      filePath: originalUrlData.publicUrl,
    });

    await newDoc.save();

    // --- 4. Lưu các trang (nếu có) ---
    if (pageEntities.length > 0) {
      await this.pageModel.insertMany(pageEntities);
    }

    await newDoc.populate('userId', 'username');

    return plainToInstance(ResponseDocumentDto, newDoc.toObject(), {
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

    const populate = {
      path: 'userId',
      select: 'username',
    };

    const result = await paginate(
      this.documentModel,
      page,
      limit,
      filter,
      { createdAt: -1 },
      populate,
    );

    return {
      ...result,
      data: plainToInstance(ResponseDocumentDto, result.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findById(id: string): Promise<ResponseDocumentDto> {
    const doc = await this.documentModel
      .findById(id)
      .populate('userId', 'username');
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
    userId?: string,
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
          `Chỉ cho phép file .pdf, .txt, hoặc .xlsx.`,
        );
      }

      const pages = await this.pageModel.find({ documentId: document._id });
      for (const page of pages) {
        if (page.filePath) {
          try {
            const pageFileName = page.filePath.split('/').slice(-1)[0];
            const { error: removePageError } = await supabase.storage
              .from('doconline')
              .remove([`documents/${document._id}/pages/${pageFileName}`]);
            if (removePageError) {
              console.warn(
                `Cảnh báo: Không thể xóa trang cũ ${pageFileName} khỏi Supabase: ${removePageError.message}`,
              );
            }
          } catch (e) {
            console.error(
              `Lỗi khi cố gắng xóa trang Supabase: ${page.filePath}`,
              e,
            );
          }
        }
      }
      await this.pageModel.deleteMany({ documentId: document._id });
      console.log(
        `Đã xóa tất cả các trang cũ cho document ID: ${document._id}`,
      );
      if (document.filePath) {
        try {
          const oldFileBucketPath = document.filePath.substring(
            document.filePath.indexOf('documents/'),
          );
          const { error: removeOldFileError } = await supabase.storage
            .from('doconline')
            .remove([oldFileBucketPath]);
          if (removeOldFileError) {
            console.warn(
              `Cảnh báo: Không thể xóa file gốc cũ ${oldFileBucketPath} khỏi Supabase: ${removeOldFileError.message}`,
            );
          }
        } catch (e) {
          console.error(
            `Lỗi khi cố gắng xóa file gốc cũ Supabase: ${document.filePath}`,
            e,
          );
        }
      }
      const originalFileName = `documents/document-${id}-${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('doconline')
        .upload(originalFileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new BadRequestException(
          `Upload file gốc mới thất bại: ${uploadError.message}`,
        );
      }

      const { data: originalUrlData } = supabase.storage
        .from('doconline')
        .getPublicUrl(originalFileName);

      if (
        !originalUrlData?.publicUrl ||
        typeof originalUrlData.publicUrl !== 'string'
      ) {
        throw new BadRequestException('Không thể lấy URL file gốc mới.');
      }

      document.filePath = originalUrlData.publicUrl;
      document.fileType = fileExt;

      const newPages: Partial<Page>[] = [];
      if (fileExt === 'pdf') {
        const pdfDoc = await PDFDocument.load(file.buffer);
        const totalPages = pdfDoc.getPages().length;

        for (let i = 0; i < totalPages; i++) {
          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
          singlePageDoc.addPage(copiedPage);
          const pdfBytes = await singlePageDoc.save();

          const pageFileName = `documents/${document._id}/pages/page_${i + 1}.pdf`;
          const { error } = await supabase.storage
            .from('doconline')
            .upload(pageFileName, Buffer.from(pdfBytes), {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            throw new BadRequestException(
              `Upload trang PDF ${i + 1} thất bại: ${error.message}`,
            );
          }

          const { data: urlData } = supabase.storage
            .from('doconline')
            .getPublicUrl(pageFileName);

          newPages.push({
            documentId: document._id as Types.ObjectId,
            pageNumber: i + 1,
            filePath: urlData.publicUrl,
            fileType: 'pdf',
          });
        }
        document.totalPages = totalPages;
      } else if (fileExt === 'txt') {
        const text = file.buffer.toString('utf-8').trim();
        const charsPerPage = 2000;
        const totalChunks = Math.ceil(text.length / charsPerPage);
        for (let i = 0; i < totalChunks; i++) {
          newPages.push({
            documentId: document._id as Types.ObjectId,
            pageNumber: i + 1,
            filePath: document.filePath,
            fileType: 'txt',
          });
        }
        document.totalPages = totalChunks;
      } else if (fileExt === 'xlsx') {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;

        for (let i = 0; i < sheetNames.length; i++) {
          const sheet = workbook.Sheets[sheetNames[i]];
          const csvBuffer = Buffer.from(
            XLSX.utils.sheet_to_csv(sheet),
            'utf-8',
          );

          const pageFileName = `documents/${document._id}/pages/sheet_${i + 1}.csv`;
          const { error } = await supabase.storage
            .from('doconline')
            .upload(pageFileName, csvBuffer, {
              contentType: 'text/csv',
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            throw new BadRequestException(
              `Upload sheet ${i + 1} thất bại: ${error.message}`,
            );
          }

          const { data: urlData } = supabase.storage
            .from('doconline')
            .getPublicUrl(pageFileName);

          newPages.push({
            documentId: document._id as Types.ObjectId,
            pageNumber: i + 1,
            filePath: urlData.publicUrl,
            fileType: 'csv',
          });
        }
        document.totalPages = sheetNames.length;
      }

      if (newPages.length > 0) {
        await this.pageModel.insertMany(newPages);
      }
    }
    Object.assign(document, dto);
    if (userId) {
      document.userId = new Types.ObjectId(userId);
    }

    const saved = await document.save();

    return plainToInstance(ResponseDocumentDto, saved.toObject(), {
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

  async splitPdf(fileBuffer: Buffer): Promise<Buffer[]> {
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const numPages = pdfDoc.getPages().length;
    const pagesBuffers: Buffer[] = [];

    for (let i = 0; i < numPages; i++) {
      const subDoc = await PDFDocument.create();
      const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
      subDoc.addPage(copiedPage);
      const pdfBytes = await subDoc.save();
      pagesBuffers.push(Buffer.from(pdfBytes));
    }
    return pagesBuffers;
  }
}
