import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicesRepository {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
  ) {}

  async findPaged(query: QueryInvoicesDto): Promise<[Invoice[], number]> {
    const {
      page,
      pageSize,
      sortBy,
      ordering,
      status,
      keyword,
      fromDate,
      toDate,
    } = query;

    const qb = this.repo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items');

    if (keyword && keyword.trim().length > 0) {
      qb.andWhere(
        '(invoice.invoiceNumber ILIKE :keyword OR invoice.customerFullname ILIKE :keyword)',
        {
          keyword: `%${keyword.trim()}%`,
        },
      );
    }

    if (status) {
      // invoice.status::text avoids Postgres eagerly binding the :status
      // parameter as the invoice_status_enum type (which would reject the
      // non-persisted "Overdue" value even when the enum branch is unused).
      qb.andWhere(
        "(invoice.status::text = :status OR (:status = 'Overdue' AND invoice.status != 'Paid' AND invoice.dueDate < CURRENT_DATE))",
        { status },
      );
    }

    if (fromDate) {
      qb.andWhere('invoice.invoiceDate >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('invoice.invoiceDate <= :toDate', { toDate });
    }

    qb.orderBy(`invoice.${sortBy}`, ordering)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    return qb.getManyAndCount();
  }

  findById(invoiceId: string): Promise<Invoice | null> {
    return this.repo.findOne({ where: { invoiceId } });
  }

  create(data: DeepPartial<Invoice>): Promise<Invoice> {
    return this.repo.save(this.repo.create(data));
  }
}
