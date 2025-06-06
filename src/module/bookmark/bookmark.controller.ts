import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from '../bookmark/dto/createBookmark.dto';
import { UpdateBookmarkDto } from '../bookmark/dto/updateBookmark.dto';
import { JwtAuthGuard } from 'src/common/auth/strategy/jwt.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Bookmarks')
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bookmark' })
  @ApiBody({ type: CreateBookmarkDto })
  @ApiResponse({ status: 201, description: 'Bookmark created' })
  create(@Body() dto: CreateBookmarkDto) {
    return this.bookmarkService.create(dto);
  }

  @Get(':bookmarkId/page-file')
  @ApiOperation({ summary: 'Get page file from bookmark' })
  @ApiParam({ name: 'bookmarkId', type: String })
  @ApiResponse({ status: 200, description: 'Page file retrieved successfully' })
  getPageFile(@Param('bookmarkId') bookmarkId: string) {
    return this.bookmarkService.getBookmarkPageFile(bookmarkId);
  }

  @Get()
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of bookmarks (with pagination & search)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of bookmarks' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ) {
    return this.bookmarkService.findAll(Number(page), Number(limit), q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bookmark details by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bookmark details' })
  findOne(@Param('id') id: string) {
    return this.bookmarkService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update bookmark by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBookmarkDto })
  @ApiResponse({ status: 200, description: 'Bookmark updated' })
  update(@Param('id') id: string, @Body() dto: UpdateBookmarkDto) {
    return this.bookmarkService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bookmark by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bookmark deleted' })
  remove(@Param('id') id: string) {
    return this.bookmarkService.remove(id);
  }
}
