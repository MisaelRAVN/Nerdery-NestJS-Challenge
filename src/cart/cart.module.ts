import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { CartResolver } from './cart.resolver';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProductsModule } from 'src/products/products.module';
import { CartItemResolver } from './cart-item.resolver';

@Module({
  imports: [ProductsModule],
  providers: [CartResolver, CartItemResolver, CartService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
