import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Product } from 'src/products/entities/product.entity';

@ObjectType()
export class CartItem {
  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  quantity: number;
}
