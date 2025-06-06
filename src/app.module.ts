// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentModule } from './module/document/document.module';
import { PageModule } from './module/page/page.module';
import { BookmarkModule } from './module/bookmark/bookmark.module';
import { UserModule } from './module/user/user.module';
import { AuthModule } from './common/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        autoIndex: true,
      }),
      inject: [ConfigService],
    }),
    DocumentModule,
    PageModule,
    BookmarkModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
