import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { StripeService } from 'src/common/stripe/services/stripe.service';
import { PaymentIntentStatus } from '@prisma/client';
import { OrdersService } from 'src/orders/services/orders.service';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { StripePaymentIntent } from 'src/common/stripe/types/stripe-payment-intent.type';

@Injectable()
export class PaymentsService {
  constructor(
    private ordersService: OrdersService,
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async create(user: ClientPayload) {
    const { order, totalAmount } = await this.ordersService.create(user);
    const amountInCents = totalAmount.times(100).toNumber();
    const [customerId, orderId] = [user.id, order.id];
    const paymentIntent = await this.stripe.createPaymentIntent(
      amountInCents,
      'usd',
      { customerId, orderId },
    );

    await this.prisma.payment.create({
      data: {
        amountInCents,
        currency: 'usd',
        orderId,
        paymentIntents: {
          create: {
            stripePaymentId: paymentIntent.id,
          },
        },
      },
    });

    return {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id,
      orderSummary: order,
    };
  }

  async updatePaymentStatus(
    paymentIntentId: string,
    status: PaymentIntentStatus,
  ) {
    await this.prisma.paymentIntent.update({
      where: { stripePaymentId: paymentIntentId },
      data: { status },
    });
  }

  async completePayment(paymentIntentObject: StripePaymentIntent) {
    await this.updatePaymentStatus(paymentIntentObject.id, 'SUCCESSFUL');

    const orderId = paymentIntentObject.metadata.orderId;
    await this.ordersService.updateStatus(orderId, 'SHIPPED');
  }

  async failPayment(paymentIntentObject: StripePaymentIntent) {
    await this.updatePaymentStatus(paymentIntentObject.id, 'FAILED');
  }

  async cancelPayment(paymentIntentObject: StripePaymentIntent) {
    await this.updatePaymentStatus(paymentIntentObject.id, 'FAILED');

    const orderId = paymentIntentObject.metadata.orderId;
    await this.ordersService.restockProducts(orderId);
    await this.ordersService.updateStatus(orderId, 'CANCELLED');
  }
}
