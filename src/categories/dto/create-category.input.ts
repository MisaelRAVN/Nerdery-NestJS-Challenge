import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Field()
  name: string;
}
