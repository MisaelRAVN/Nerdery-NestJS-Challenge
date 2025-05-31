import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeMetadataPayload } from '../types/stripe-metadata-payload';

@Injectable()
export class StripeService {
  constructor(
    @Inject(Stripe) private readonly stripe: Stripe,
    private configService: ConfigService,
  ) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    { customerId, orderId }: StripeMetadataPayload,
  ) {
    console.log(
      'Stripe service reporting: Attempting to create a payment intent...',
    );
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { customerId, orderId },
    });

    return { id: paymentIntent.id, clientSecret: paymentIntent.client_secret };
  }

  constructEvent(rawBody: Buffer<ArrayBufferLike>, stripeSignature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '',
    );
    return event;
  }

  async getProducts(): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list();
    return products.data;
  }

  async getCustomers() {
    const customers = await this.stripe.customers.list({});
    return customers.data;
  }
}
