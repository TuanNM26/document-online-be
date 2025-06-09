import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/createDocument.dto';
import { UpdateDocumentDto } from './dto/updateDocument.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/auth/strategy/jwt.guard';
import { RolesGuard } from '../../common/auth/strategy/role.guard';
import { Roles } from '../../common/decorator/role';

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        field: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  createDocument(
  @Body() body: CreateDocumentDto,
  @UploadedFile() file: Express.Multer.File,
  @Req() req: any,
) {
  const userId = req.user.id;
  return this.documentService.create({
    ...body,
    file,
    userId,
  });
}

  @Get()
  @ApiOperation({ summary: 'Get a list of documents' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const validPage = pageNumber > 0 ? pageNumber : 1;
    const validLimit = limitNumber > 0 ? limitNumber : 10;
    return this.documentService.findAll(validPage, validLimit, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  findOne(@Param('id') id: string) {
    return this.documentService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update a document by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        field: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentService.update(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a document by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  remove(@Param('id') id: string) {
    return this.documentService.delete(id);
  }
}
