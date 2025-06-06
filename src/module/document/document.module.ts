import { forwardRef, Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentSchema, Document } from './document.schema';
import { DocumentGateway } from './document.gateway';
import { PageModule } from '../page/page.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
    ]),
    forwardRef(() => PageModule),
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentGateway],
  exports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
    ]),
    DocumentGateway,
  ],
})
export class DocumentModule {}
