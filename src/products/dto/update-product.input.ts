import { CreateProductInput } from './create-product.input';
import { InputType, Field, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput extends PartialType(
  OmitType(CreateProductInput, ['categoryIds'] as const),
) {
  @Field({ nullable: true })
  isActive?: boolean;
}
