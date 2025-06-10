import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { CartItem } from './cart-item.entity';

@ObjectType()
export class Cart {
  @Field(() => ID)
  id: string;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}
