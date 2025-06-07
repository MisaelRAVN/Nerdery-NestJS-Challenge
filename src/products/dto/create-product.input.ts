import { InputType, Int, Field, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateProductInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Field()
  name: string;

  @IsPositive()
  @Field(() => Float)
  price: number;

  @IsNumber()
  @IsPositive()
  @Field(() => Int)
  stock: number;

  @Field(() => [Int])
  categoryIds: number[];

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: true, nullable: true })
  isActive?: boolean;
}
