import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { OrderItem } from './order-item.entity';
import { DecimalTransformer } from '../common/decimal.transformer';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0, transformer: DecimalTransformer })
  totalAmount: number;

  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
