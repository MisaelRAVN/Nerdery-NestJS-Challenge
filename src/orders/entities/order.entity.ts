import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { OrderDetail } from './order-detail.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { OrderStatus } from '@prisma/client';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field({ nullable: true })
  shipDate?: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

  @Field(() => [OrderDetail])
  details: OrderDetail[];

  @Field(() => Payment, { nullable: true })
  payment?: Payment;
}
