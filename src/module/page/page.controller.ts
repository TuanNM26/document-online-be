import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { PageService } from './page.service';
import { CreatePageDto } from './dto/createPage.dto';
import { UpdatePageDto } from './dto/updatePage.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ResponsePageDto } from './dto/responsePage.dto';

@ApiTags('Pages')
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Get all pages of a document by documentId' })
  @ApiParam({ name: 'documentId', required: true })
  async getPagesByDocument(@Param('documentId') documentId: string) {
    const pages = await this.pageService.findByDocumentId(documentId);
    return { data: pages };
  }

  @Post(':id/pages')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Thêm các trang vào tài liệu đã tồn tại' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'ID của document',
    type: String,
  })
  @ApiBody({
    description: 'File PDF cần tách thành các trang và thêm vào document',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  async addPages(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponsePageDto[]> {
    return this.pageService.addPagesToDocument(id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of all pages' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ) {
    return this.pageService.findAll(Number(page), Number(limit), q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page information by id' })
  @ApiParam({ name: 'id', required: true })
  findOne(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: [ResponsePageDto] })
  async updatePageFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponsePageDto[]> {
    return this.pageService.updatePageFile(id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a page' })
  @ApiParam({ name: 'id', required: true })
  remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}
