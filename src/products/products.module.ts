import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsResolver } from './products.resolver';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [ProductsResolver, ProductsService, PrismaService],
  exports: [ProductsService],
})
export class ProductsModule {}
