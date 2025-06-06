import { forwardRef, Module } from '@nestjs/common';
import { PageController } from './page.controller';
import { PageService } from './page.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from './page.schema';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }]),
    forwardRef(() => DocumentModule),
  ],
  controllers: [PageController],
  providers: [PageService],
  exports: [
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }]),
  ],
})
export class PageModule {}
