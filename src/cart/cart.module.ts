import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { CartResolver } from './cart.resolver';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [CartResolver, CartService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
