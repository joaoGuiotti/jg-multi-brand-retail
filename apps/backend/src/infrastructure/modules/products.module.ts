import { Module } from '@nestjs/common';
import { AdjustStockUseCase } from '../../application/use-cases/products/adjust-stock.use-case';
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/products/delete-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/products/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/products/update-product.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/products/update-stock.use-case';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { ProductsController } from '../controllers/products.controller';
import { PrismaProductRepository } from '../persistence/repositories/prisma-product.repository';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: ProductRepository,
      useClass: PrismaProductRepository,
    },
    CreateProductUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    UpdateStockUseCase,
    AdjustStockUseCase,
  ],
  exports: [
    ProductRepository,
    CreateProductUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    UpdateStockUseCase,
    AdjustStockUseCase,
  ],
})
export class ProductsModule {}
