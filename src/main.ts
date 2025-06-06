import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger';
import cors from 'cors';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
  .setTitle('Document API')
  .setDescription('API for managing documents')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    },
    'access-token', 
  )
  .build();

  app.use(cors({
  origin: 'http://localhost:3001', // Cho phép truy cập từ origin của frontend Next.js của bạn
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Cho phép các phương thức này
  allowedHeaders: ['Content-Type', 'Authorization'], // Cho phép các headers này
  credentials: true // Nếu bạn đang gửi cookies hoặc authentication headers (JWT)
}));


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
