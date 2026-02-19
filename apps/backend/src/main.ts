import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // ==== Swagger ==== //
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventory Management System')
    .setDescription('The admin of inventory management system API')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });
  // ==== Swagger ==== //

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
