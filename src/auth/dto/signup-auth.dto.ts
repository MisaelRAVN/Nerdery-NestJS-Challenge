import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  @IsString()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @IsString()
  password: string;

  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
