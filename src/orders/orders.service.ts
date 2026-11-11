import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Customer } from '../customers/customer.entity';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { paginate } from '../common/pagination';

// Alur status yang diperbolehkan
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Membuat pesanan + detail item dalam satu transaksi, memotong stok, dan menyimpan harga saat transaksi. */
  async create(dto: CreateOrderDto) {
    const orderId = await this.dataSource.transaction(async (manager) => {
      const customer = await manager.findOne(Customer, { where: { id: dto.customerId } });
      if (!customer) throw new BadRequestException(`Pelanggan dengan id ${dto.customerId} tidak ditemukan`);

      // Gabungkan productId duplikat; urutkan agar urutan lock konsisten
      const qtyMap = new Map<number, number>();
      for (const item of dto.items) {
        qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.quantity);
      }
      const productIds = [...qtyMap.keys()].sort((a, b) => a - b);

      const items: OrderItem[] = [];
      let total = 0;
      for (const productId of productIds) {
        const quantity = qtyMap.get(productId)!;
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) throw new BadRequestException(`Produk dengan id ${productId} tidak ditemukan`);
        if (product.stock < quantity) {
          throw new BadRequestException(
            `Stok produk "${product.name}" tidak mencukupi (tersedia ${product.stock}, diminta ${quantity})`,
          );
        }
        product.stock -= quantity;
        await manager.save(product);

        const subtotal = Math.round(product.price * quantity * 100) / 100;
        total += subtotal;
        items.push(manager.create(OrderItem, { productId, quantity, unitPrice: product.price, subtotal }));
      }

      const order = manager.create(Order, {
        customerId: dto.customerId,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes ?? null,
        status: OrderStatus.PENDING,
        totalAmount: Math.round(total * 100) / 100,
        items,
      });
      const saved = await manager.save(order);
      return saved.id;
    });
    return this.findOne(orderId);
  }

  async findAll(query: QueryOrderDto) {
    const { page, limit, status, customerId } = query;
    const [data, total] = await this.repo.findAndCount({
      where: { ...(status ? { status } : {}), ...(customerId ? { customerId } : {}) },
      relations: { customer: true },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  /** Detail pesanan beserta pelanggan dan informasi produk pada setiap item. */
  async findOne(id: number) {
    const order = await this.repo.findOne({
      where: { id },
      relations: { customer: true, items: { product: true } },
      order: { items: { id: 'ASC' } },
    });
    if (!order) throw new NotFoundException(`Pesanan dengan id ${id} tidak ditemukan`);
    return order;
  }

  async update(id: number, dto: UpdateOrderDto) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id } });
      if (!order) throw new NotFoundException(`Pesanan dengan id ${id} tidak ditemukan`);

      if (dto.status === undefined && dto.shippingAddress === undefined && dto.notes === undefined) {
        throw new BadRequestException('Tidak ada data yang diubah');
      }

      if (dto.shippingAddress !== undefined && order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Alamat pengiriman hanya dapat diubah saat pesanan berstatus PENDING');
      }

      if (dto.status !== undefined && dto.status !== order.status) {
        if (!ALLOWED_TRANSITIONS[order.status].includes(dto.status)) {
          throw new BadRequestException(`Status tidak dapat diubah dari ${order.status} ke ${dto.status}`);
        }
        if (dto.status === OrderStatus.CANCELLED) await this.restoreStock(manager, id);
        order.status = dto.status;
      }
      if (dto.shippingAddress !== undefined) order.shippingAddress = dto.shippingAddress;
      if (dto.notes !== undefined) order.notes = dto.notes;
      await manager.save(order);
    });
    return this.findOne(id);
  }

  /** Hanya pesanan PENDING atau CANCELLED yang boleh dihapus. Stok dikembalikan jika masih PENDING. */
  async remove(id: number) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id } });
      if (!order) throw new NotFoundException(`Pesanan dengan id ${id} tidak ditemukan`);
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
        throw new BadRequestException(`Pesanan berstatus ${order.status} tidak dapat dihapus`);
      }
      if (order.status === OrderStatus.PENDING) await this.restoreStock(manager, id);
      await manager.remove(order); // order_items ikut terhapus (ON DELETE CASCADE)
    });
  }

  private async restoreStock(manager: EntityManager, orderId: number) {
    const items = await manager.find(OrderItem, { where: { orderId }, order: { productId: 'ASC' } });
    for (const item of items) {
      await manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
    }
  }
}
