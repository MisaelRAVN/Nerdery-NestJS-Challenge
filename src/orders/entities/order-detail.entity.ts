import { Field, ObjectType } from '@nestjs/graphql';
import { Product } from 'src/products/entities/product.entity';

@ObjectType()
export class OrderDetail {
  @Field(() => Product)
  product: Product;

  @Field()
  unitPrice: number;

  @Field()
  quantity: number;
}
