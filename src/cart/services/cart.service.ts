import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientPayload } from '../../auth/entities/client-payload.entity';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';

@Injectable()
export class CartService {
  constructor(
    private readonly productsService: ProductsService,
    private prisma: PrismaService,
  ) {}

  async getCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true, categories: true },
            },
          },
        },
      },
    });
  }

  async updateCartItem(
    user: ClientPayload,
    productId: string,
    quantity: number,
  ) {
    if (quantity < 0) {
      throw new BadRequestException('Invalid request was sent.', {
        description: 'Quantity cannot be a negative number',
      });
    }
    const canUseProduct = await this.userCanUseProduct(productId, user);
    if (!canUseProduct) {
      throw new BadRequestException('Invalid request was sent.', {
        description: 'Product cannot be interacted with',
      });
    }

    if (quantity > 0) {
      await this.prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: user.cartId, productId } },
        update: { quantity },
        create: { cartId: user.cartId, productId, quantity },
      });
    } else {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: user.cartId, productId },
        limit: 1,
      });
    }

    return this.getCart(user.id);
  }

  async removeCartItem(user: ClientPayload, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('No such active product could be found', {
        description: 'No active product with given id was found',
      });
    }

    try {
      await this.prisma.cartItem.delete({
        where: {
          cartId_productId: {
            cartId: user.cartId,
            productId,
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(error);
    }

    return this.getCart(user.id);
  }

  async clearCart(user: ClientPayload) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId: user.cartId },
    });

    return this.getCart(user.id);
  }

  private async userCanUseProduct(productId: string, user: ClientPayload) {
    const product = await this.productsService.findOne(productId, user);
    return product != null;
  }
}
