# Guia de Melhores Práticas — Documentação Swagger (NestJS)

> **Referência interna para o time de desenvolvimento do JG Multi-Brand Retail.**
> Toda nova rota ou alteração de controller deve seguir este guia antes do merge.

---

## Sumário

1. [Checklist por Tipo de Endpoint](#checklist)
2. [Configuração Global (`main.ts`)](#configuracao-global)
3. [Controllers — Nível da Classe](#controllers-classe)
4. [Controllers — Nível do Método](#controllers-metodo)
5. [DTOs — Documentando o Body](#dtos)
6. [Padrão de `operationId`](#operationid)
7. [Documentando Respostas de Erro](#erros)
8. [Endpoints que Retornam PDF](#pdf)
9. [Exemplos Prontos (Copy-Paste)](#exemplos)
10. [Anti-Padrões — O que NÃO fazer](#anti-padroes)

---

## 1. Checklist por Tipo de Endpoint {#checklist}

Use este checklist ao criar ou revisar qualquer endpoint:

### Endpoint padrão (GET/POST/PATCH/DELETE)

- [ ] `@ApiOperation({ summary, description, operationId })`
- [ ] `@ApiResponse` para o status de **sucesso** (200, 201, 204)
- [ ] `@ApiResponse` para **401** (se protegido por JWT)
- [ ] `@ApiResponse` para **403** (se houver controle de role)
- [ ] `@ApiResponse` para **404** (se busca por ID)
- [ ] `@ApiResponse` para **422** (se recebe body com validação)
- [ ] `@ApiParam` para cada **path param** (`:id`, `:slug`, etc.)
- [ ] `@ApiQuery` para cada **query param** opcional
- [ ] `@ApiBearerAuth('JWT')` na classe (se todo o controller é protegido)

### Endpoint de download (PDF, CSV)

- [ ] Todos os itens acima **+**
- [ ] `@ApiProduces('application/pdf')` no método
- [ ] `@ApiResponse` com `content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } }`

### Endpoint público (sem JWT)

- [ ] `@ApiOperation({ summary, description })`
- [ ] `@ApiResponse` para sucesso
- [ ] `@ApiResponse` para **404** (se aplicável)
- [ ] **NÃO** adicionar `@ApiBearerAuth`

---

## 2. Configuração Global (`main.ts`) {#configuracao-global}

```typescript
const swaggerConfig = new DocumentBuilder()
  .setTitle('Nome da API')
  .setDescription('Descrição em Markdown com ## seções')
  .setVersion('1.0.0')                          // SemVer
  .setContact('Time Dev', 'url', 'email')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3000', 'Desenvolvimento')
  .addServer('https://api.producao.com', 'Produção')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
    'JWT',                                      // ← nome da security scheme
  )
  .addTag('users', 'Descrição da tag')          // ← define a ordem das tags
  .build();

SwaggerModule.setup('swagger', app, documentFactory, {
  swaggerOptions: {
    persistAuthorization: true,    // mantém o token entre reloads
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    docExpansion: 'none',          // UI mais limpa por padrão
    filter: true,                  // habilita busca no UI
    showRequestDuration: true,     // mostra tempo de resposta
  },
});
```

> **Regra**: Sempre use o nome `'JWT'` na `addBearerAuth` e nos decorators `@ApiBearerAuth('JWT')` dos controllers. Usar nomes diferentes causará desconexão entre o token e os endpoints.

---

## 3. Controllers — Nível da Classe {#controllers-classe}

```typescript
@ApiTags('products')          // ← nome da tag no Swagger UI
@ApiBearerAuth('JWT')         // ← aplica para TODOS os métodos da classe
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController { ... }
```

**Quando NÃO colocar `@ApiBearerAuth` na classe:**
- Se alguns endpoints são públicos (ex: `AuthController`) → coloque no método individual
- Se o controller mistura endpoints públicos e privados

---

## 4. Controllers — Nível do Método {#controllers-metodo}

### Template completo para GET com ID

```typescript
@Get(':id')
@ApiOperation({
  summary: 'Título curto (< 60 chars)',        // ← aparece na lista
  description: 'Descrição detalhada com contexto de negócio e regras.',
  operationId: 'resource_findOne',             // ← ver seção #operationId
})
@ApiParam({
  name: 'id',
  description: 'UUID do recurso',
  format: 'uuid',
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
})
@ApiResponse({ status: 200, description: 'Recurso encontrado com sucesso' })
@ApiResponse({ status: 401, description: 'Token JWT ausente ou inválido', type: UnauthorizedResponseDto })
@ApiResponse({ status: 403, description: 'Perfil sem permissão', type: ForbiddenResponseDto })
@ApiResponse({ status: 404, description: 'Recurso não encontrado', type: NotFoundResponseDto })
async findOne(@Param('id') id: string) { ... }
```

### Template para GET com query params opcionais

```typescript
@Get()
@ApiOperation({ summary: 'Listar recursos', operationId: 'resource_findAll' })
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
@ApiQuery({
  name: 'status',
  required: false,
  enum: ['ACTIVE', 'INACTIVE'],       // ← usa enum para valores fixos
})
@ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
async findAll(@Query() query: QueryDto) { ... }
```

### Template para POST (criação)

```typescript
@Post()
@ApiOperation({
  summary: 'Criar recurso',
  description: 'Regras de negócio relevantes para a criação.',
  operationId: 'resource_create',
})
@ApiResponse({ status: 201, description: 'Recurso criado com sucesso' })
@ApiResponse({ status: 401, ..., type: UnauthorizedResponseDto })
@ApiResponse({ status: 403, ..., type: ForbiddenResponseDto })
@ApiResponse({ status: 422, description: 'Dados inválidos', type: ValidationErrorResponseDto })
async create(@Body() dto: CreateDto) { ... }
```

---

## 5. DTOs — Documentando o Body {#dtos}

Cada campo do DTO deve ter `@ApiProperty` **completo**:

```typescript
export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto exibido no PDV',
    example: 'Cerveja Heineken Long Neck 330ml',
    type: String,
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Preço de venda unitário em Reais',
    example: 7.99,
    type: Number,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Código SKU único dentro do Tenant',
    example: 'CERV-HEIN-330',
    type: String,
    format: 'sku',          // formato customizado — apenas documentação
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'UUID da categoria do produto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
    format: 'uuid',         // formato UUID padrão OpenAPI
    required: false,        // marcar campos opcionais explicitamente
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Status de disponibilidade no PDV',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],  // enum gera select no Swagger UI
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: string;
}
```

### Regras para DTOs

| Campo | `@ApiProperty` obrigatório? |
|---|---|
| Campos de texto | `type: String`, `minLength`, `maxLength` |
| Campos numéricos | `type: Number`, `minimum`, `maximum` |
| UUIDs | `type: String`, `format: 'uuid'` |
| Booleanos | `type: Boolean` |
| Enums | `enum: ['VAL1', 'VAL2']` |
| Campos opcionais | `required: false` |
| Arrays | `type: [ItemType]` ou `isArray: true` |

---

## 6. Padrão de `operationId` {#operationid}

O `operationId` é usado pelos geradores de SDK (Swagger Codegen, OpenAPI Generator) para nomear as funções. Use sempre o padrão:

```
<tagName>_<methodName>
```

### Exemplos

| Controller | Método | `operationId` |
|---|---|---|
| `ProductsController` | `create` | `products_create` |
| `ProductsController` | `findAll` | `products_findAll` |
| `ProductsController` | `findOne` | `products_findOne` |
| `ProductsController` | `update` | `products_update` |
| `ProductsController` | `remove` | `products_remove` |
| `LoyaltyController` | `configure` | `loyalty_configure` |
| `LoyaltyController` | `getAccount` | `loyalty_getAccount` |
| `AuthController` | `login` | `auth_login` |
| `SalesController` | `getDailyRevenue` | `sales_getDailyRevenue` |

> **Regra**: Use camelCase para o método e snake_case para separar a tag do método. **Nunca repita** um `operationId` — o Swagger não valida, mas os geradores de SDK quebram.

---

## 7. Documentando Respostas de Erro {#erros}

### Importe os DTOs comuns de erro

```typescript
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';
```

### Mapa de erros por situação

| Situação | Status | DTO |
|---|---|---|
| Token ausente ou expirado | 401 | `UnauthorizedResponseDto` |
| Role sem permissão | 403 | `ForbiddenResponseDto` |
| Recurso não encontrado por ID | 404 | `NotFoundResponseDto` |
| Body com validação falha | 422 | `ValidationErrorResponseDto` |
| Regra de negócio (ex: venda não pode ser cancelada) | 422 | `ValidationErrorResponseDto` |

### Quando usar 400 vs 422?

- **400 Bad Request**: request malformada (JSON inválido, tipo errado)
- **422 Unprocessable Entity**: dados válidos mas que violam regras (campo ausente, valor fora do range)

> Este projeto usa **422** para todos os erros de validação do `class-validator` (configurado via `errorHttpStatusCode: 422` no `ValidationPipe`).

---

## 8. Endpoints que Retornam PDF {#pdf}

```typescript
@Get('report')
@ApiProduces('application/pdf')          // ← Content-Type da resposta
@ApiOperation({
  summary: 'Download do relatório (PDF)',
  operationId: 'resource_getReport',
})
@ApiResponse({
  status: 200,
  description: 'PDF gerado com sucesso',
  content: {
    'application/pdf': {
      schema: { type: 'string', format: 'binary' },
    },
  },
})
async getReport(@Res() res: Response) {
  const buffer = await this.generateReport();
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="report.pdf"',
    'Content-Length': buffer.length,
  });
  res.end(buffer);
}
```

---

## 9. Exemplos Prontos (Copy-Paste) {#exemplos}

### Resposta com schema inline

```typescript
@ApiResponse({
  status: 200,
  description: 'Dados retornados com sucesso',
  schema: {
    example: {
      id: 'uuid',
      name: 'Exemplo',
      createdAt: '2026-05-28T10:00:00Z',
    },
  },
})
```

### Resposta de lista paginada

```typescript
@ApiResponse({
  status: 200,
  description: 'Lista retornada com sucesso',
  schema: {
    example: {
      data: [{ id: 'uuid', name: 'Item 1' }],
      total: 100,
      page: 1,
      limit: 10,
    },
  },
})
```

### Body com campo único (sem DTO dedicado)

```typescript
@ApiBody({
  schema: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: {
        type: 'number',
        minimum: 0,
        description: 'Nova quantidade em estoque',
        example: 50,
      },
    },
  },
})
```

---

## 10. Anti-Padrões — O que NÃO fazer {#anti-padroes}

| ❌ Anti-padrão | ✅ Correto |
|---|---|
| `@ApiResponse({ status: 200 })` sem `description` | `@ApiResponse({ status: 200, description: 'Sucesso' })` |
| `@ApiTags('Loyalty')` com maiúscula | `@ApiTags('loyalty')` em minúsculo |
| `@ApiOperation({ summary: 'API de produtos' })` genérico | `@ApiOperation({ summary: 'Buscar produto por ID' })` específico |
| `@ApiProperty({ description: 'ID' })` sem example | `@ApiProperty({ description: 'UUID do produto', example: 'uuid-aqui' })` |
| `@ApiBearerAuth()` sem nome | `@ApiBearerAuth('JWT')` com o nome da security scheme |
| Documentar apenas 200 | Documentar 200/201, 401, 403, 404, 422 conforme aplicável |
| `@ApiParam` com `name` errado | `name` deve ser **idêntico** ao parâmetro da rota |
| `enum Role` local duplicado no controller | Importar `Role` de `@prisma/client` |
| `operationId` duplicado entre controllers | Usar prefixo da tag: `auth_login`, `sales_findAll` |

---

## Verificação Rápida

Antes do PR, acesse `http://localhost:3000/swagger` e confirme:

1. ✅ O endpoint aparece na tag correta
2. ✅ O cadeado 🔒 aparece nos endpoints protegidos
3. ✅ O **body** tem todos os campos com descrição e exemplo
4. ✅ Os **path params** aparecem como campos editáveis
5. ✅ Os **query params** aparecem com suas opções/tipos
6. ✅ As **respostas** mostram todos os status codes documentados
7. ✅ O JSON em `/swagger/json` é válido (valide em [editor.swagger.io](https://editor.swagger.io))
