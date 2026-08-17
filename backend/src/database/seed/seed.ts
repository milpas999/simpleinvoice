import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { InvoiceItem } from '../../invoices/entities/invoice-item.entity';
import { InvoiceStatus } from '../../invoices/entities/invoice-status.enum';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { User } from '../../users/user.entity';
import { generateSeedInvoices } from './seed-data';

dotenv.config();

const SEED_USER_EMAIL =
  process.env.SEED_USER_EMAIL ?? 'reviewer@simpleinvoice.dev';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Reviewer123!';
const SEED_USER_FULLNAME = 'Reviewer';
const ADDITIONAL_INVOICE_COUNT = 30;

// Uses its own DataSource (synchronize forced on outside production) so the
// seed script works even if the Nest app has never booted yet.
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Invoice, InvoiceItem],
  synchronize: process.env.NODE_ENV !== 'production',
});

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const invoiceRepo = dataSource.getRepository(Invoice);

  let reviewer = await userRepo.findOne({ where: { email: SEED_USER_EMAIL } });
  if (!reviewer) {
    const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10);
    reviewer = await userRepo.save(
      userRepo.create({
        email: SEED_USER_EMAIL,
        passwordHash,
        fullname: SEED_USER_FULLNAME,
      }),
    );
    console.log(`Seeded reviewer user: ${SEED_USER_EMAIL}`);
  } else {
    console.log(`Reviewer user already exists: ${SEED_USER_EMAIL}`);
  }

  const today = new Date();
  let created = 0;

  // Appendix A sample invoice. Its documented "Overdue" status is itself a
  // derived display value (its dueDate is in the past and it's partially
  // paid) — the closest valid persisted status is "Pending".
  const appendixInvoice = {
    invoiceNumber: 'IV1780488206995',
    invoiceReference: '#5721662',
    invoiceDate: '2026-06-03',
    dueDate: '2026-07-03',
    currency: 'AUD',
    currencySymbol: 'AU$',
    description: 'Invoice is issued to Kanglee',
    status: InvoiceStatus.Pending,
    taxPercent: 10,
    customerFullname: 'Paul',
    customerEmail: 'paul@101digital.io',
    customerMobileNumber: '947717364111',
    customerAddress: 'Singapore',
    invoiceSubTotal: 2000.0,
    totalTax: 200.0,
    totalDiscount: 20.0,
    totalAmount: 2180.0,
    totalPaid: 1451.34,
    balanceAmount: 728.66,
    items: [{ name: 'Honda RC150', quantity: 2, rate: 1000 }],
  };

  const invoiceSeeds = [
    appendixInvoice,
    ...generateSeedInvoices(ADDITIONAL_INVOICE_COUNT, today).map((seed) => ({
      invoiceNumber: seed.invoiceNumber,
      invoiceReference: seed.invoiceReference,
      invoiceDate: seed.invoiceDate,
      dueDate: seed.dueDate,
      currency: seed.currency,
      currencySymbol: seed.currencySymbol,
      description: seed.description,
      status: InvoiceStatus[seed.status],
      taxPercent: seed.taxPercent,
      customerFullname: seed.customerFullname,
      customerEmail: seed.customerEmail,
      customerMobileNumber: seed.customerMobileNumber,
      customerAddress: seed.customerAddress,
      invoiceSubTotal: seed.invoiceSubTotal,
      totalTax: seed.totalTax,
      totalDiscount: seed.totalDiscount,
      totalAmount: seed.totalAmount,
      totalPaid: seed.totalPaid,
      balanceAmount: seed.balanceAmount,
      items: [seed.item],
    })),
  ];

  for (const seed of invoiceSeeds) {
    const exists = await invoiceRepo.findOne({
      where: { invoiceNumber: seed.invoiceNumber },
    });
    if (exists) continue;

    await invoiceRepo.save(
      invoiceRepo.create({
        ...seed,
        createdBy: reviewer.id,
      }),
    );
    created += 1;
  }

  console.log(
    `Seeded ${created} invoice(s) (${invoiceSeeds.length - created} already existed).`,
  );

  await dataSource.destroy();
}

seed()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
