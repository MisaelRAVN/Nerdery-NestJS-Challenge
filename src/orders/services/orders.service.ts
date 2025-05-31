import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { UserPayload } from 'src/auth/entities/user-payload.entity';
import { Role } from 'src/auth/enums/role.enum';
import { CartService } from 'src/cart/services/cart.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private prismaService: PrismaService,
    private cartService: CartService,
    //private paymentsService: PaymentsService,
  ) {}

  async create(user: ClientPayload) {
    const cart = await this.cartService.getCart(user.id);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const totalAmount = cart.items.reduce((acc, curr) => {
      if (curr.quantity > curr.product.stock) {
        throw new ConflictException('Not enough stock available');
      }
      return curr.product.price.times(curr.quantity).plus(acc);
    }, new Prisma.Decimal(0));

    const orderCreation = this.prismaService.orderHeader.create({
      data: {
        customerId: user.id,
        status: OrderStatus.PENDING,
        details: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: {
        details: { include: { product: true } },
      },
    });

    const productsStockUpdates = cart.items.map(({ productId, quantity }) =>
      this.prismaService.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      }),
    );

    const [order] = await this.prismaService.$transaction([
      orderCreation,
      ...productsStockUpdates,
    ]);

    await this.cartService.clearCart(user);

    return { order, totalAmount };
  }

  async findAll(userId?: string) {
    return await this.prismaService.orderHeader.findMany({
      where: userId != null ? { customerId: userId } : {},
      omit: { customerId: true },
      include: {
        customer: { omit: { password: true } },
        details: { include: { product: true } },
        payment: true,
      },
    });
  }

  async findOne(orderId: string, user: UserPayload) {
    const order = await this.prismaService.orderHeader.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        details: { include: { product: true } },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (user.role !== Role.MANAGER && user.id !== order.customerId) {
      throw new ForbiddenException('Do not have permission to request order.', {
        description:
          'Server refused to perform action due to insufficient rights',
      });
    }

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    return this.prismaService.orderHeader.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: true,
        details: { include: { product: true } },
        payment: true,
      },
    });
  }

  async restockProducts(orderId: string) {
    const items = await this.prismaService.orderDetail.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    const productsStockUpdates = items.map(({ productId, quantity }) =>
      this.prismaService.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      }),
    );

    await this.prismaService.$transaction(productsStockUpdates);
  }
}
