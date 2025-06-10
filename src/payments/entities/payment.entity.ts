import {
  Field,
  Float,
  ID,
  ObjectType,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { PaymentIntent } from './payment-intent.entity';

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field(() => [PaymentIntent])
  paymentIntents: PaymentIntent[];

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
