import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { Request } from 'express';
import { StripeService } from 'src/common/stripe/services/stripe.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { StripePaymentIntent } from 'src/common/stripe/types/stripe-payment-intent.type';

@Controller()
export class PaymentsController {
  constructor(
    private stripeService: StripeService,
    private paymentsService: PaymentsService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @Post('payments')
  async generatePayment(@CurrentUser() user: ClientPayload) {
    return this.paymentsService.create(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('payment-webhook')
  async paymentWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('Stripe-Signature') stripeSignature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('A raw body must be provided');
    const event = this.stripeService.constructEvent(rawBody, stripeSignature);
    console.log(event.data.object);
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentsService.completePayment(
          event.data.object as StripePaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.paymentsService.failPayment(
          event.data.object as StripePaymentIntent,
        );
        break;
      case 'payment_intent.canceled':
        await this.paymentsService.cancelPayment(
          event.data.object as StripePaymentIntent,
        );
        break;
      default:
        break;
    }
    console.log(event);
    return;
  }
}
