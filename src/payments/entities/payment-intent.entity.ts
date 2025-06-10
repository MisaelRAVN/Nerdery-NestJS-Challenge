import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
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

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
