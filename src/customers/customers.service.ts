import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Order } from '../orders/order.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto, paginate } from '../common/pagination';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async create(dto: CreateCustomerDto) {
    await this.ensureEmailUnique(dto.email);
    return this.repo.save(this.repo.create(dto));
  }

  async findAll({ page, limit }: PaginationQueryDto) {
    const [data, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: number) {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Pelanggan dengan id ${id} tidak ditemukan`);
    return customer;
  }

  findOrders(id: number) {
    return this.findOne(id).then(() =>
      this.orderRepo.find({ where: { customerId: id }, order: { id: 'DESC' } }),
    );
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    if (dto.email && dto.email !== customer.email) await this.ensureEmailUnique(dto.email);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: number) {
    const customer = await this.findOne(id);
    const orderCount = await this.orderRepo.count({ where: { customerId: id } });
    if (orderCount > 0) {
      throw new ConflictException(
        `Pelanggan tidak dapat dihapus karena memiliki ${orderCount} pesanan`,
      );
    }
    await this.repo.remove(customer);
  }

  private async ensureEmailUnique(email: string) {
    if (await this.repo.exist({ where: { email } })) {
      throw new ConflictException(`Email "${email}" sudah terdaftar`);
    }
  }
}
