/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../../auth/enums/role.enum';
import { ClientPayload } from '../../auth/entities/client-payload.entity';
import { Cart } from '../entities/cart.entity';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('CartService', () => {
  let service: CartService;
  let prisma: DeepMocked<PrismaService>;
  let productsService: DeepMocked<ProductsService>;

  const client: ClientPayload = {
    id: 'user-id',
    email: 'john@example.com',
    role: Role.CLIENT,
    cartId: 'cart-id',
  };

  beforeEach(async () => {
    prisma = createMock<PrismaService>();
    productsService = createMock<ProductsService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('should return the user cart with nested items', async () => {
      const expected: Cart = {
        id: client.cartId,
        items: [],
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      (prisma.cart.findUnique as jest.Mock).mockResolvedValueOnce(expected);

      const actual = await service.getCart(client.cartId);

      expect(actual).toEqual(expected);
      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: client.cartId },
        include: {
          items: {
            include: {
              product: { include: { images: true, categories: true } },
            },
          },
        },
      });
    });
  });

  describe('updateCartItem', () => {
    const productId = 'product-id';
    const quantity = 3;
    const cartAfterUpdate: Cart = {
      id: client.cartId,
      items: [
        {
          quantity,
          product: {
            id: productId,
            categories: [],
            images: [],
            description: 'lorem ipsum',
            isActive: true,
            name: 'shirt-name',
            price: 123,
            stock: 5,
          },
        },
      ],
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    it('should upsert when quantity is greater than 0', async () => {
      (prisma.cartItem.upsert as jest.Mock).mockResolvedValueOnce({});
      (prisma.cart.findUnique as jest.Mock).mockResolvedValueOnce(
        cartAfterUpdate,
      );
      (productsService.findOne as jest.Mock).mockResolvedValueOnce({
        id: productId,
      });

      const actual = await service.updateCartItem(client, productId, 3);

      expect(actual).toEqual(cartAfterUpdate);
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { cartId_productId: { cartId: client.cartId, productId } },
        update: { quantity },
        create: { cartId: client.cartId, productId, quantity },
      });
    });

    it('should delete product item when quantity equals 0', async () => {
      (prisma.cartItem.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: cartAfterUpdate.items.length,
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValueOnce({
        ...cartAfterUpdate,
        items: [],
      });
      (productsService.findOne as jest.Mock).mockResolvedValueOnce({
        id: productId,
      });

      await service.updateCartItem(client, productId, 0);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: client.cartId, productId },
        limit: 1,
      });
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      await expect(
        service.updateCartItem(client, productId, -1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user cannot use product', async () => {
      (productsService.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        service.updateCartItem(client, productId, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeCartItem', () => {
    const productId = 'product-id';

    it('should delete the cartItem and return the cart', async () => {
      const expected = { id: client.cartId, items: [] };
      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce({
        id: productId,
        isActive: true,
      } as any);
      (prisma.cartItem.delete as jest.Mock).mockResolvedValueOnce({} as any);
      (prisma.cart.findUnique as jest.Mock).mockResolvedValueOnce(expected);

      const actual = await service.removeCartItem(client, productId);

      expect(actual).toEqual(expected);
    });

    it('should throw NotFoundException if no such active product exists', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.removeCartItem(client, productId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if the product is not found in the cart', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce({
        id: productId,
        isActive: true,
      } as any);
      (prisma.cartItem.delete as jest.Mock).mockRejectedValueOnce(new Error());

      await expect(service.removeCartItem(client, productId)).rejects.toThrow();
    });
  });

  describe('clearCart', () => {
    it('should delete all items and return the empty cart', async () => {
      const emptyCart = { id: client.cartId, items: [] };
      (prisma.cartItem.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 3,
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValueOnce(emptyCart);

      const actual = await service.clearCart(client);

      expect(actual).toEqual(emptyCart);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: client.cartId },
      });
    });
  });
});
