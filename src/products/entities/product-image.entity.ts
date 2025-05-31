import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductImage {
  @Field()
  id: number;

  @Field()
  url: string;
}
