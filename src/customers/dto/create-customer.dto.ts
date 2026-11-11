import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'phone harus berupa angka 8-15 digit (boleh diawali +)' })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
