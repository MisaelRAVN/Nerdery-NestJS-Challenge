import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PaymentIntentStatus } from '@prisma/client';

registerEnumType(PaymentIntentStatus, { name: 'PaymentIntentStatus' });

@ObjectType()
export class PaymentIntent {
  @Field(() => ID)
  id: string;

  @Field()
  stripePaymentId: string;

  @Field(() => PaymentIntentStatus)
  status: PaymentIntentStatus;

  @Field({ nullable: true })
  statusInfo?: string;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}
