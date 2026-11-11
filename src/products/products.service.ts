import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { OrderItem } from '../orders/order-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
  ) {}

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    const saved = await this.repo.save(this.repo.create(dto));
    return this.findOne(saved.id);
  }

  async findAll(query: QueryProductDto) {
    const { page, limit, categoryId, search } = query;
    const [data, total] = await this.repo.findAndCount({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { name: ILike(`%${search}%`) } : {}),
      },
      relations: { category: true },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: number) {
    const product = await this.repo.findOne({ where: { id }, relations: { category: true } });
    if (!product) throw new NotFoundException(`Produk dengan id ${id} tidak ditemukan`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.categoryId !== undefined) await this.ensureCategoryExists(dto.categoryId);
    Object.assign(product, dto);
    // hindari TypeORM memakai relasi lama saat categoryId berubah
    delete (product as Partial<Product>).category;
    await this.repo.save(product);
    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    const used = await this.itemRepo.count({ where: { productId: id } });
    if (used > 0) {
      throw new ConflictException(
        'Produk tidak dapat dihapus karena sudah tercatat pada detail pesanan',
      );
    }
    await this.repo.remove(product);
  }

  private async ensureCategoryExists(categoryId: number) {
    if (!(await this.categoryRepo.exist({ where: { id: categoryId } }))) {
      throw new BadRequestException(`Kategori dengan id ${categoryId} tidak ditemukan`);
    }
  }
}
