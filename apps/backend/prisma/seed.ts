import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { join } from 'path';
import { Pool } from 'pg';

// Load environment variables from envs/.env
const envPath = join(__dirname, '../envs/.env');
const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

const pool = new Pool({ connectionString: process.env.DB_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Limpar dados existentes (cuidado em produção!)
  await prisma.auditLog.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.conditionalItem.deleteMany();
  await prisma.conditional.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('✅ Dados existentes removidos');

  // Criar Tenant de Teste
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Loja Demo',
      slug: 'loja-demo',
      logoUrl: 'https://api.dicebear.com/9.x/shapes/png?seed=standard-retail&backgroundColor=0a2540',
      active: true,
      settings: {
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        features: {
          conditionals: true,
          inventory: true,
        },
      },
    },
  });

  console.log('✅ Tenant criado:', tenant1.name);

  // Criar Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'admin@sistema.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.SUPER_ADMIN,
      name: 'Super Admin',
      active: true,
    },
  });

  console.log('✅ Super Admin criado:', superAdmin.email);

  // Criar Admin da Loja
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'admin@lojademo.com',
      passwordHash: await bcrypt.hash('loja123', 10),
      role: Role.ADMIN,
      name: 'Administrador Loja Demo',
      active: true,
    },
  });

  console.log('✅ Admin criado:', admin.email);

  // Criar Vendedor
  const user = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'vendedor@lojademo.com',
      passwordHash: await bcrypt.hash('vendedor123', 10),
      role: Role.USER,
      name: 'João Vendedor',
      active: true,
    },
  });

  console.log('✅ Usuário criado:', user.email);

  // Criar Categorias
  const categoria1 = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Eletrônicos',
    },
  });

  const categoria2 = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Moda',
    },
  });

  const subcategoria1 = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Smartphones',
      parentId: categoria1.id,
    },
  });

  console.log('✅ Categorias criadas');

  // Criar Marcas
  const marca1 = await prisma.brand.create({
    data: {
      tenantId: tenant1.id,
      name: 'Samsung',
    },
  });

  const marca2 = await prisma.brand.create({
    data: {
      tenantId: tenant1.id,
      name: 'Apple',
    },
  });

  console.log('✅ Marcas criadas');

  // Criar Fornecedor
  const fornecedor = await prisma.supplier.create({
    data: {
      tenantId: tenant1.id,
      name: 'Distribuidora Tech LTDA',
      document: '12.345.678/0001-90',
      contact: '(11) 98765-4321',
    },
  });

  console.log('✅ Fornecedor criado');

  // Criar Produtos
  const produto1 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: 'Samsung Galaxy S24',
      sku: 'SAM-S24-BLK',
      barcode: '7891234567890',
      categoryId: subcategoria1.id,
      brandId: marca1.id,
      supplierId: fornecedor.id,
      costPrice: 3000,
      salePrice: 4500,
      margin: 50,
      stockQuantity: 25,
      unit: 'UN',
      active: true,
      metadata: {
        color: 'Preto',
        storage: '256GB',
        warranty: '12 meses',
      },
    },
  });

  const produto2 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: 'iPhone 15 Pro',
      sku: 'APL-IP15P-BLU',
      barcode: '7891234567891',
      categoryId: subcategoria1.id,
      brandId: marca2.id,
      supplierId: fornecedor.id,
      costPrice: 6000,
      salePrice: 8500,
      margin: 41.67,
      stockQuantity: 15,
      unit: 'UN',
      active: true,
      metadata: {
        color: 'Azul Titânio',
        storage: '512GB',
        warranty: '12 meses',
      },
    },
  });

  const produto3 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: 'Camiseta Básica',
      sku: 'MODA-CAM-001',
      categoryId: categoria2.id,
      costPrice: 20,
      salePrice: 50,
      margin: 150,
      stockQuantity: 100,
      unit: 'UN',
      active: true,
    },
  });

  console.log('✅ Produtos criados');

  // Criar Venda de Exemplo
  const venda = await prisma.sale.create({
    data: {
      tenantId: tenant1.id,
      userId: user.id,
      invoiceNumber: 'VND-001',
      status: 'COMPLETED',
      subtotal: 9000,
      discount: 500,
      total: 8500,
      items: {
        create: [
          {
            productId: produto1.id,
            quantity: 1,
            unitPrice: 4500,
            discount: 0,
            total: 4500,
          },
          {
            productId: produto2.id,
            quantity: 1,
            unitPrice: 8500,
            discount: 4000,
            total: 4500,
          },
        ],
      },
      payments: {
        create: [
          {
            tenantId: tenant1.id,
            method: 'PIX',
            amount: 8500,
            installments: 1,
            fee: 0,
            status: 'PAID',
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  console.log('✅ Venda de exemplo criada:', venda.invoiceNumber);

  // Atualizar estoque
  await prisma.product.update({
    where: { id: produto1.id },
    data: { stockQuantity: 24 },
  });

  await prisma.product.update({
    where: { id: produto2.id },
    data: { stockQuantity: 14 },
  });

  console.log('✅ Estoque atualizado');

  // ─── Customers ────────────────────────────────────────────────────
  await prisma.customer.createMany({
    data: [
      {
        tenantId: tenant1.id,
        firstName: 'Ana',
        lastName: 'Oliveira',
        email: 'ana.oliveira@email.com',
        phone: '(11) 99123-4567',
        isActive: true,
        document: '12345678901',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 4B',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      {
        tenantId: tenant1.id,
        firstName: 'Carlos',
        lastName: 'Mendes',
        email: 'carlos.mendes@email.com',
        phone: '(21) 98765-1234',
        isActive: true,
        document: '12345678902',
        street: 'Av. Atlântica',
        number: '500',
        complement: null,
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22010-000',
      },
      {
        tenantId: tenant1.id,
        firstName: 'Mariana',
        lastName: 'Santos',
        email: 'mariana.santos@email.com',
        phone: '(31) 97654-3210',
        isActive: true,
        document: '12345678903',
        street: 'Rua da Bahia',
        number: '800',
        complement: 'Sala 3',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30160-011',
      },
      {
        tenantId: tenant1.id,
        firstName: 'Roberto',
        lastName: 'Lima',
        email: 'roberto.lima@email.com',
        phone: '(41) 96543-2109',
        isActive: false,
        document: '12345678904',
        street: 'Rua XV de Novembro',
        number: '42',
        complement: null,
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80020-310',
      },
    ],
  });

  console.log('✅ Customers criados (4)');
  // ──────────────────────────────────────────────────────────────────

  console.log('\n🎉 Seed concluído com sucesso!\n');
  console.log('📝 Credenciais criadas:');
  console.log('   - Super Admin: admin@sistema.com / admin123');
  console.log('   - Admin Loja:  admin@lojademo.com / loja123');
  console.log('   - Vendedor:    vendedor@lojademo.com / vendedor123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
