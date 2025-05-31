import Stripe from 'stripe';
import { StripeMetadataPayload } from './stripe-metadata-payload';

export type StripePaymentIntent = Stripe.PaymentIntent & {
  metadata: StripeMetadataPayload;
};
