/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../../orders/services/orders.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StripeService } from '../../common/stripe/services/stripe.service';
import { Prisma } from '@prisma/client';
import { ClientPayload } from '../../auth/entities/client-payload.entity';
import { Role } from '../../auth/enums/role.enum';
import { StripePaymentIntent } from '../../common/stripe/types/stripe-payment-intent.type';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaServiceMock: DeepMocked<PrismaService>;
  let ordersServiceMock: DeepMocked<OrdersService>;
  let stripeServiceMock: DeepMocked<StripeService>;

  const client: ClientPayload = {
    id: 'user-id',
    email: 'john@example.com',
    role: Role.CLIENT,
    cartId: 'cart-id',
  };

  const fakeOrder = {
    id: 'order-id',
    details: [
      {
        quantity: 1,
        unitPrice: 12.34,
        product: { id: 'product-id-1' },
      },
    ],
    status: 'PENDING',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const totalAmount = new Prisma.Decimal(12.34);
  const paymentIntent = {
    id: 'pi_123',
    clientSecret: 'pi_123_secret_456',
  };

  beforeEach(async () => {
    prismaServiceMock = createMock<PrismaService>();
    ordersServiceMock = createMock<OrdersService>();
    stripeServiceMock = createMock<StripeService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a payment intent, persist a payment and return summary', async () => {
      const expected = {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.id,
        orderSummary: fakeOrder,
      };
      const amountInCents = totalAmount.times(100).toNumber();

      (ordersServiceMock.create as jest.Mock).mockResolvedValueOnce({
        order: fakeOrder,
        totalAmount,
      });
      stripeServiceMock.createPaymentIntent.mockResolvedValueOnce(
        paymentIntent,
      );
      (prismaServiceMock.payment.create as jest.Mock).mockResolvedValueOnce({});

      const actual = await service.create(client);

      expect(ordersServiceMock.create).toHaveBeenCalledWith(client);
      expect(stripeServiceMock.createPaymentIntent).toHaveBeenCalledWith(
        amountInCents,
        'usd',
        {
          customerId: client.id,
          orderId: fakeOrder.id,
        },
      );
      expect(prismaServiceMock.payment.create).toHaveBeenCalledWith({
        data: {
          amountInCents,
          currency: 'usd',
          orderId: fakeOrder.id,
          paymentIntents: {
            create: { stripePaymentId: paymentIntent.id },
          },
        },
      });
      expect(actual).toEqual(expected);
    });

    it('should throw InternalServerError and leave DB untouched', async () => {
      (ordersServiceMock.create as jest.Mock).mockResolvedValueOnce({
        order: fakeOrder,
        totalAmount,
      });
      stripeServiceMock.createPaymentIntent.mockRejectedValueOnce(
        new Error('stripe down'),
      );

      await expect(service.create(client)).rejects.toThrow('stripe down');
      expect(prismaServiceMock.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment intent status', async () => {
      (
        prismaServiceMock.paymentIntent.update as jest.Mock
      ).mockResolvedValueOnce({});

      await service.updatePaymentStatus('pi_123', 'SUCCESSFUL');

      expect(prismaServiceMock.paymentIntent.update).toHaveBeenCalledWith({
        where: { stripePaymentId: 'pi_123' },
        data: { status: 'SUCCESSFUL' },
      });
    });

    it('should throw an error if payment intent is missing', async () => {
      (
        prismaServiceMock.paymentIntent.update as jest.Mock
      ).mockRejectedValueOnce(new Error('not found'));

      await expect(
        service.updatePaymentStatus('non-existent', 'FAILED'),
      ).rejects.toThrow('not found');
    });
  });

  describe('completePayment', () => {
    it('should mark intent successful and ship order', async () => {
      const paymentIntentObject = {
        id: 'pi_123',
        metadata: {
          orderId: 'order-id',
          customerId: 'user-id',
        },
      };

      await service.completePayment(
        paymentIntentObject as any as StripePaymentIntent,
      );

      expect(prismaServiceMock.paymentIntent.update).toHaveBeenCalledWith({
        where: { stripePaymentId: paymentIntentObject.id },
        data: { status: 'SUCCESSFUL' },
      });
      expect(ordersServiceMock.updateStatus).toHaveBeenCalledWith(
        paymentIntentObject.metadata.orderId,
        'SHIPPED',
      );
    });
  });

  describe('failPayment', () => {
    it('should mark intent as FAILED only', async () => {
      const paymentIntentObject = {
        id: 'pi_123',
        metadata: {
          orderId: 'order-id',
          customerId: 'user-id',
        },
      };

      await service.failPayment(
        paymentIntentObject as any as StripePaymentIntent,
      );

      expect(prismaServiceMock.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FAILED' } }),
      );
      expect(ordersServiceMock.updateStatus).not.toHaveBeenCalled();
      expect(ordersServiceMock.restockProducts).not.toHaveBeenCalled();
    });
  });

  describe('cancelPayment', () => {
    it('should fail intent, restock items, and cancel order', async () => {
      const paymentIntentObject = {
        id: 'pi_123',
        metadata: {
          orderId: 'order-id',
          customerId: 'user-id',
        },
      };

      await service.cancelPayment(
        paymentIntentObject as any as StripePaymentIntent,
      );

      expect(prismaServiceMock.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FAILED' } }),
      );
      expect(ordersServiceMock.restockProducts).toHaveBeenCalledWith(
        paymentIntentObject.metadata.orderId,
      );
      expect(ordersServiceMock.updateStatus).toHaveBeenCalledWith(
        paymentIntentObject.metadata.orderId,
        'CANCELLED',
      );
    });
  });
});
