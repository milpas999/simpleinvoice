import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { User } from '../../users/user.entity';
import { InvoiceItem } from './invoice-item.entity';
import { InvoiceStatus } from './invoice-status.enum';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid', { name: 'invoice_id' })
  invoiceId: string;

  @Index('IDX_invoices_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'invoice_reference', nullable: true })
  invoiceReference?: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: string;

  @Index()
  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ name: 'currency_symbol', length: 5 })
  currencySymbol: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status_enum',
    default: InvoiceStatus.Draft,
  })
  status: InvoiceStatus;

  @Column({
    name: 'tax_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10,
    transformer: DecimalTransformer,
  })
  taxPercent: number;

  @Column({ name: 'customer_fullname' })
  customerFullname: string;

  @Column({ name: 'customer_email' })
  customerEmail: string;

  @Column({ name: 'customer_mobile_number', nullable: true })
  customerMobileNumber?: string;

  @Column({ name: 'customer_address', type: 'text', nullable: true })
  customerAddress?: string;

  @Column({
    name: 'invoice_sub_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  invoiceSubTotal: number;

  @Column({
    name: 'total_tax',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  totalTax: number;

  @Column({
    name: 'total_discount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  totalDiscount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  totalAmount: number;

  @Column({
    name: 'total_paid',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  totalPaid: number;

  @Column({
    name: 'balance_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  balanceAmount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: ['insert'],
    eager: true,
  })
  items: InvoiceItem[];
}
