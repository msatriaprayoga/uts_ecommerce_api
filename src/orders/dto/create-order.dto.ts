import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min, ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  customerId: number;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'items minimal berisi 1 produk' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
