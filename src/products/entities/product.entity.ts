import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';
import { ProductImage } from './product-image.entity';
import { Category } from '../../categories/entities/category.entity';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field({ nullable: true })
  isActive: boolean;

  @Field(() => [Category])
  categories: Category[];

  @Field(() => [ProductImage])
  images: ProductImage[];

  @Field({
    nullable: true,
    description:
      'Indicates whether the product is liked by the authenticated user. Returns null if the user is not authenticated.',
  })
  liked?: boolean;
}
