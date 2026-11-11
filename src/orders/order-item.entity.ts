import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { DecimalTransformer } from '../common/decimal.transformer';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  // Harga produk saat transaksi (snapshot), tidak berubah walau harga produk diubah
  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: DecimalTransformer })
  subtotal: number;
}
