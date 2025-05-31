import { Module } from '@nestjs/common';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './services/orders.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CartModule } from 'src/cart/cart.module';

@Module({
  imports: [CartModule],
  providers: [OrdersResolver, OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
