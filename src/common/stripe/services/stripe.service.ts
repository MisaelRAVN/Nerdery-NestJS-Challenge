import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
      return event;
    } catch (error) {
      throw new UnauthorizedException('Stripe Signature is not valid', {
        cause: error,
      });
    }
  }
}
