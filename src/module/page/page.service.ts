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



const DOCOLINE = "doconline"
@Injectable()
export class PageService {
  constructor(
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private documentGateway: DocumentGateway,
  ) {}
 

  async createPage(
  dto: CreatePageDto,
  file: Express.Multer.File,
): Promise<ResponsePageDto[]> {
  const document = await this.documentModel.findById(dto.documentId);
  if (!document) {
    throw new BadRequestException(MESSAGES.DOCUMENT_NOT_FOUND);
  }

  this.validateFileType(document.fileType, file);

  const fileExt = file.originalname.split('.').pop() || 'pdf';

  // Parse PDF để lấy số trang
  const pdfData = await pdfParse(file.buffer);
  const totalNewPages = pdfData.numpages;

  if (!totalNewPages || totalNewPages <= 0) {
    throw new BadRequestException('Không thể đọc được số trang PDF.');
  }

    // Tìm pageNumber tiếp theo
    let nextPageNumber = 1;
    const lastPage = await this.pageModel
      .findOne({ documentId: new Types.ObjectId(dto.documentId) }) // lưu ý đổi thành 'document'
      .sort({ pageNumber: -1 })
      .exec();
    
    if (lastPage) {
      nextPageNumber = lastPage.pageNumber + 1;
    }
    console.log(lastPage)
    console.log(nextPageNumber)
  // Upload file PDF lên Supabase
  const fileName = `pages/${dto.documentId}-${uuidv4()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(DOCOLINE)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new BadRequestException(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(DOCOLINE)
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;
  const createdPageDocs: PageDocument[] = [];
  console.log(dto.documentId)
  for (let i = 0; i < totalNewPages; i++) {
    const page = new this.pageModel({
  documentId: new Types.ObjectId(dto.documentId),
  pageNumber: nextPageNumber + i,
  filePath: publicUrl,
  fileType: fileExt,
  pdfPageIndex: i + 1,
});

    await page.save();
    createdPageDocs.push(page);
  }

  // Cập nhật tổng số trang trong document
  await this.documentModel.findByIdAndUpdate(dto.documentId, {
    $inc: { totalPages: totalNewPages },
  });

  const populatedPages = await this.pageModel
  .find({ _id: { $in: createdPageDocs.map(p => (p as any)._id) } })
  .populate('documentId','title field filePath fileType totalPages')
  .exec();

  // Gửi thông báo real-time
  await this.documentGateway.notifyPageChange(dto.documentId.toString(), 'added');

  // Chuyển đổi sang DTO và trả về
  return populatedPages.map(page =>
    plainToInstance(ResponsePageDto, page.toObject(), {
      excludeExtraneousValues: true,
    }),
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

   async update(
    id: string,
    file?: Express.Multer.File,
  ): Promise<ResponsePageDto | ResponsePageDto[]> {
    const oldPage = await this.pageModel.findById(id);
    if (!oldPage) {
      throw new NotFoundException(MESSAGES.PAGE_NOT_FOUND);
    }

    if (file) {
      const document = await this.documentModel.findById(oldPage.documentId);
      if (!document) {
        throw new BadRequestException(MESSAGES.DOCUMENT_NOT_FOUND);
      }

      this.validateFileType(document.fileType, file);
      const fileExt = file.originalname.split('.').pop() || 'pdf';

      const pdfData = await pdfParse(file.buffer);
      const totalNewPages = pdfData.numpages;

      if (!totalNewPages || totalNewPages <= 0) {
        throw new BadRequestException('Cannot read number of pages from the new PDF file.');
      }

      const oldPageNumber = oldPage.pageNumber;
      const pageNumberDifference = totalNewPages - 1; 

      if (pageNumberDifference !== 0) {
        await this.pageModel.updateMany(
          {
            documentId: oldPage.documentId,
            pageNumber: { $gt: oldPageNumber }, 
          },
          { $inc: { pageNumber: pageNumberDifference } }, 
        );
      }
      const oldFileName = oldPage.filePath.split('/').pop();
      if (oldFileName) {
        const { error: deleteError } = await supabase.storage
          .from(DOCOLINE)
          .remove([`pages/${oldFileName}`]);
        if (deleteError) {
          console.warn(`Failed to delete old file ${oldFileName}: ${deleteError.message}`);
        }
      }

      await this.pageModel.deleteOne({ _id: oldPage._id });

      const newFileName = `pages/${oldPage.documentId}-${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(DOCOLINE)
        .upload(newFileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new BadRequestException(`Upload new file failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(DOCOLINE)
        .getPublicUrl(newFileName);
      const newPublicUrl = urlData.publicUrl;
      const createdPageDocs: PageDocument[] = [];
      for (let i = 0; i < totalNewPages; i++) {
        const newPage = new this.pageModel({
          documentId: new Types.ObjectId(oldPage.documentId),
          pageNumber: oldPageNumber + i, 
          filePath: newPublicUrl,
          fileType: fileExt,
          pdfPageIndex: i + 1,
        });
        await newPage.save();
        createdPageDocs.push(newPage);
      }

      await this.documentModel.findByIdAndUpdate(oldPage.documentId, {
        $inc: { totalPages: pageNumberDifference },
      });

      await this.documentGateway.notifyPageChange(
        oldPage.documentId.toString(),
        'updated',
      );

      const populatedPages = await this.pageModel
        .find({ _id: { $in: createdPageDocs.map(p => (p as any)._id) } })
        .populate('documentId', 'title field filePath fileType totalPages')
        .exec();

      return populatedPages.map(page =>
        plainToInstance(ResponsePageDto, page.toObject(), {
          excludeExtraneousValues: true,
        }),
      );

    } else {
      const savedPage = await oldPage.save();

      await this.documentGateway.notifyPageChange(
        oldPage.documentId.toString(),
        'updated',
      );
      

      const populatedPage = await this.pageModel
        .findById(savedPage._id)
        .populate('documentId', 'title field filePath fileType totalPages')
        .exec();
      if(!populatedPage){
        throw new NotFoundException("not found")
      }
      
      return plainToInstance(ResponsePageDto, populatedPage.toObject(), {
        excludeExtraneousValues: true,
      });
    }
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
