/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CartService } from '../../cart/services/cart.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Role } from '../../auth/enums/role.enum';
import { ClientPayload } from '../../auth/entities/client-payload.entity';
import { UserPayload } from '../../auth/entities/user-payload.entity';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Cart } from '../../cart/entities/cart.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../../products/entities/product.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaMock: DeepMocked<PrismaService>;
  let cartServiceMock: DeepMocked<CartService>;

  beforeEach(async () => {
    prismaMock = createMock<PrismaService>();
    cartServiceMock = createMock<CartService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  const mockProductA: Product = {
    id: 'product-id-a',
    categories: [],
    images: [],
    description: 'lorem ipsum',
    isActive: true,
    name: 'shirt-name',
    price: 10,
    stock: 5,
  };
  const mockProductB: Product = {
    ...mockProductA,
    id: 'product-id-b',
    price: 4,
    stock: 20,
  };
  const client: ClientPayload = {
    id: 'user-id',
    email: 'john@example.com',
    role: Role.CLIENT,
    cartId: 'cart-id',
  };
  const mockOrders: Order[] = [
    {
      id: 'order-id-1',
      status: 'SHIPPED',
      details: [
        { quantity: 1, product: mockProductA, unitPrice: mockProductA.price },
        { quantity: 1, product: mockProductB, unitPrice: mockProductB.price },
      ],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'order-id-2',
      status: 'CANCELLED',
      details: [
        { quantity: 1, product: mockProductA, unitPrice: mockProductA.price },
      ],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  describe('create', () => {
    const cartWithItems = {
      id: 'cart-id',
      items: [
        {
          quantity: 2,
          product: {
            ...mockProductA,
            price: new Prisma.Decimal(mockProductA.price),
          },
        },
        {
          quantity: 1,
          product: {
            ...mockProductB,
            price: new Prisma.Decimal(mockProductB.price),
          },
        },
      ],
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    it("should perform a transaction that moves products from the user's cart to an order", async () => {
      (cartServiceMock.getCart as jest.Mock).mockResolvedValueOnce(
        cartWithItems,
      );

      const expected = {
        order: {
          id: 'order-id-1',
          details: [
            {
              ...cartWithItems.items[0],
              unitPrice: cartWithItems.items[0].product.price,
            },
            {
              ...cartWithItems.items[1],
              unitPrice: cartWithItems.items[1].product.price,
            },
          ],
          status: 'PENDING',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        totalAmount: new Prisma.Decimal(24),
      };
      (prismaMock.orderHeader.create as jest.Mock).mockResolvedValue(expected);
      prismaMock.$transaction.mockResolvedValue([expected.order]);

      const actual = await service.create(client);

      expect(actual.order).toEqual(expected.order);
      expect(actual.totalAmount).toEqual(expected.totalAmount);
      expect(prismaMock.orderHeader.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.update).toHaveBeenCalledTimes(
        cartWithItems.items.length,
      );
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(cartServiceMock.clearCart).toHaveBeenCalledWith(client);
    });

    it('should throw BadRequestException if cart is empty', async () => {
      (cartServiceMock.getCart as jest.Mock).mockResolvedValueOnce({
        ...cartWithItems,
        items: [],
      });

      try {
        await service.create(client);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toEqual('Cart is empty');
        expect(prismaMock.orderHeader.create).not.toHaveBeenCalled();
        expect(prismaMock.product.update).not.toHaveBeenCalled();
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      }
    });

    it('should throw ConflictException if requested quantity exceeds stock', async () => {
      const overStockCart: Cart = {
        ...cartWithItems,
        items: [
          {
            quantity: 99,
            product: {
              id: 'product-id-99',
              categories: [],
              images: [],
              description: 'lorem ipsum',
              isActive: true,
              name: 'shirt-name',
              price: 10,
              stock: 1,
            },
          },
        ],
      };

      (cartServiceMock.getCart as jest.Mock).mockResolvedValueOnce(
        overStockCart,
      );

      try {
        await service.create(client);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).message).toEqual(
          'Not enough stock available',
        );
        expect(prismaMock.orderHeader.create).not.toHaveBeenCalled();
        expect(prismaMock.product.update).not.toHaveBeenCalled();
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      }
    });
  });

  describe('findAll', () => {
    it('should return all orders for manager', async () => {
      const expected = mockOrders;
      (prismaMock.orderHeader.findMany as jest.Mock).mockResolvedValueOnce(
        mockOrders,
      );

      const actual = await service.findAll();

      expect(actual).toEqual(expected);
      expect(prismaMock.orderHeader.findMany).toHaveBeenCalledWith({
        where: {},
        omit: { customerId: true },
        include: {
          customer: { omit: { password: true } },
          details: { include: { product: true } },
          payment: true,
        },
      });
    });

    it('should filter orders by userId', async () => {
      const expected = mockOrders;
      (prismaMock.orderHeader.findMany as jest.Mock).mockResolvedValueOnce(
        expected,
      );

      const actual = await service.findAll(client.id);

      expect(actual).toEqual(expected);
      expect(prismaMock.orderHeader.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: client.id } }),
      );
    });
  });

  describe('findOne', () => {
    const order: Order = mockOrders[0];
    const manager: UserPayload = {
      id: 'user-id-manager',
      role: Role.MANAGER,
      email: 'john@example.com',
    };

    it('should return order if manager', async () => {
      (prismaMock.orderHeader.findUnique as jest.Mock).mockResolvedValueOnce({
        ...order,
        customerId: manager.id,
      });
      const expected = { ...order, customerId: manager.id };

      const actual = await service.findOne(order.id, manager);

      expect(actual).toEqual(expected);
    });

    it('should return order if owner', async () => {
      (prismaMock.orderHeader.findUnique as jest.Mock).mockResolvedValueOnce({
        ...order,
        customerId: client.id,
      });
      const expected = { ...order, customerId: client.id };

      const actual = await service.findOne(order.id, client);
      expect(actual).toEqual(expected);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      (prismaMock.orderHeader.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      try {
        await service.findOne('non-existent-order', client);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toEqual('Order not found');
      }
    });

    it('should throw ForbiddenException if user is neither manager nor owner', async () => {
      (prismaMock.orderHeader.findUnique as jest.Mock).mockResolvedValueOnce({
        ...order,
        customerId: 'other-clients-id',
      });

      try {
        await service.findOne(order.id, client);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).message).toEqual(
          'Do not have permission to request order.',
        );
      }
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = { id: 'order-id-1', status: OrderStatus.SHIPPED };
      (prismaMock.orderHeader.update as jest.Mock).mockResolvedValueOnce(order);
      const expected = order;

      const actual = await service.updateStatus(order.id, OrderStatus.SHIPPED);

      expect(actual).toEqual(expected);
      expect(prismaMock.orderHeader.update).toHaveBeenCalledWith({
        where: { id: 'order-id-1' },
        data: { status: OrderStatus.SHIPPED },
        include: {
          customer: true,
          details: { include: { product: true } },
          payment: true,
        },
      });
    });

    it('should throw an error when order is missing', async () => {
      (prismaMock.orderHeader.update as jest.Mock).mockRejectedValueOnce(
        new Error(),
      );

      await expect(
        service.updateStatus('non-existing-order', OrderStatus.CANCELLED),
      ).rejects.toThrow();
    });
  });

  describe('restockProducts', () => {
    it('should increment product stock for each order item', async () => {
      (prismaMock.orderDetail.findMany as jest.Mock).mockResolvedValueOnce([
        { productId: 'product-id-1', quantity: 2 },
        { productId: 'product-id-2', quantity: 1 },
      ]);
      prismaMock.$transaction.mockResolvedValueOnce(void 0);

      await service.restockProducts('order-id-1');

      expect(prismaMock.orderDetail.findMany).toHaveBeenCalledWith({
        where: { orderId: 'order-id-1' },
        select: { productId: true, quantity: true },
      });
      expect(prismaMock.product.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
