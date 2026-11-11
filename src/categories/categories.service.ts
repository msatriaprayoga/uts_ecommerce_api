import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '../products/product.entity';
import { PaginationQueryDto, paginate } from '../common/pagination';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateCategoryDto) {
    await this.ensureNameUnique(dto.name);
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
    const category = await this.repo.findOne({ where: { id }, relations: { products: true } });
    if (!category) throw new NotFoundException(`Kategori dengan id ${id} tidak ditemukan`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) await this.ensureNameUnique(dto.name);
    Object.assign(category, dto);
    delete (category as Partial<Category>).products;
    return this.repo.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    const productCount = await this.productRepo.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ConflictException(
        `Kategori tidak dapat dihapus karena masih memiliki ${productCount} produk`,
      );
    }
    await this.repo.remove(category);
  }

  private async ensureNameUnique(name: string) {
    if (await this.repo.exist({ where: { name } })) {
      throw new ConflictException(`Kategori dengan nama "${name}" sudah ada`);
    }
  }
}
