import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '../services/stripe.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UnauthorizedException } from '@nestjs/common';

const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  products: {
    list: jest.fn(),
  },
  customers: {
    list: jest.fn(),
  },
};

describe('StripeService', () => {
  let service: StripeService;

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: configService },
        { provide: Stripe, useValue: mockStripe },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createPaymentIntent', () => {
    it('should create a payment intent with correct values', async () => {
      const expected = {
        id: 'pi_test_123',
        clientSecret: 'pi_test_123_sk_456',
      };
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: expected.id,
        client_secret: expected.clientSecret,
      });
      const inputAmount = 5000;
      const inputCurrency = 'usd';
      const inputMetadata = { customerId: 'user-id', orderId: 'order-id' };

      const actual = await service.createPaymentIntent(
        inputAmount,
        inputCurrency,
        inputMetadata,
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: inputAmount,
        currency: inputCurrency,
        metadata: inputMetadata,
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('constructEvent', () => {
    const inputRawBody = Buffer.from('payload');
    const inputSignature = 'signature';

    it('should call Stripe.webhooks.constructEvent with correct args', () => {
      const expected = { type: 'payment_intent.succeeded' };

      mockStripe.webhooks.constructEvent.mockReturnValue(expected);

      const actual = service.constructEvent(inputRawBody, inputSignature);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        inputRawBody,
        inputSignature,
        'whsec_test',
      );

      expect(actual).toEqual(expected);
    });

    it('should throw an Unauthorized exception if stripe signature is invalid', () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(new Error());
      try {
        service.constructEvent(inputRawBody, inputSignature);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).message).toEqual(
          'Stripe Signature is not valid',
        );
      }
    });
  });
});
