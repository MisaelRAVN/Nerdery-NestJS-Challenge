import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { PaymentIntent } from './payment-intent.entity';

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  date?: boolean;

  @Field()
  currency: string;

  @Field(() => [PaymentIntent])
  paymentIntents: PaymentIntent[];
}
