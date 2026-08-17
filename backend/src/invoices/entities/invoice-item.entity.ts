import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column()
  name: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  rate: number;
}
