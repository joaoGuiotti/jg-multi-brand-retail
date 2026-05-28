import { WrapperDataInterceptor } from '@infrastructure/interceptors/wrapper-data/wrapper-data.interceptor';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? console : undefined,
  });
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new WrapperDataInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // ==== Swagger ==== //
  const swaggerConfig = new DocumentBuilder()
    .setTitle('JG Multi-Brand Retail — API')
    .setDescription(
      `## Sistema de Gestão de Varejo Multi-Marca\n\n` +
        `API REST para gerenciamento de **vendas**, **estoque**, **clientes**, **pagamentos**, **devoluções** e **programa de fidelidade**.\n\n` +
        `### Autenticação\n` +
        `Todos os endpoints (exceto \`/auth/login\`, \`/auth/register\` e \`/auth/tenants/by-slug/:slug\`) exigem um **Bearer Token JWT** no header:\n` +
        `\`\`\`\nAuthorization: Bearer <seu_token>\n\`\`\`\n\n` +
        `### Controle de Acesso por Perfil\n` +
        `| Perfil | Descrição |\n` +
        `|---|---|\n` +
        `| \`SUPER_ADMIN\` | Acesso irrestrito a todos os recursos |\n` +
        `| \`ADMIN\` | Gestão completa dentro do Tenant |\n` +
        `| \`USER\` | Operações de PDV (vendas, pagamentos, consultas) |\n\n` +
        `### Formato de Erros\n` +
        `Erros de validação retornam HTTP \`422\` com o seguinte corpo:\n` +
        `\`\`\`json\n{ "statusCode": 422, "message": ["campo é obrigatório"], "error": "Unprocessable Entity" }\n\`\`\``,
    )
    .setVersion('1.0.0')
    .setContact(
      'Time de Desenvolvimento',
      'https://github.com/joaoGuiotti/jg-multi-brand-retail',
      'dev@jgretail.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Desenvolvimento Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insira o token JWT: Bearer <token>',
        in: 'header',
      },
      'JWT',
    )
    .addTag('auth', 'Autenticação, registro e gerenciamento de usuários')
    .addTag('dashboard', 'Indicadores e snapshot em tempo real do Tenant')
    .addTag('products', 'Catálogo de produtos e controle de estoque')
    .addTag('customers', 'Cadastro e gerenciamento de clientes')
    .addTag('sales', 'Ciclo de vida de vendas no PDV')
    .addTag('payments', 'Registro e gerenciamento de pagamentos')
    .addTag('returns', 'Solicitação e processamento de devoluções')
    .addTag('inventory', 'Movimentações e relatórios de estoque')
    .addTag('loyalty', 'Configuração e operações do programa de fidelidade')
    .addTag('notifications', 'Notificações em tempo real e preferências do usuário')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
  // ==== Swagger ==== //

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
