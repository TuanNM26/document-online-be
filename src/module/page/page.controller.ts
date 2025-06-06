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
} from '@nestjs/swagger';

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

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new page' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createPage(
    @Body() dto: CreatePageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.pageService.createPage(dto, file);
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

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update a page' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', required: true })
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
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.pageService.update(id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a page' })
  @ApiParam({ name: 'id', required: true })
  remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}
