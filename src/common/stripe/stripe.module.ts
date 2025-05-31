import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './services/stripe.service';
import Stripe from 'stripe';

@Global()
@Module({})
export class StripeModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      providers: [
        StripeService,
        {
          provide: Stripe,
          useFactory: (configService: ConfigService) => {
            const apiKey = configService.get<string>('STRIPE_API_KEY') ?? '';
            return new Stripe(apiKey);
          },
          inject: [ConfigService],
        },
      ],
      exports: [StripeService],
    };
  }
}
