import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';
import { OrderStatus } from '../order.entity';

export class QueryOrderDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  customerId?: number;
}
