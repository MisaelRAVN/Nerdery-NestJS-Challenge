import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Image {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
