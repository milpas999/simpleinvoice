import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Invoice } from '../src/invoices/entities/invoice.entity';
import { User } from '../src/users/user.entity';

interface AuthResponseBody {
  accessToken: string;
}

interface InvoiceResponseBody {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  invoiceSubTotal: number;
  totalTax: number;
  totalAmount: number;
  items: { name: string }[];
}

interface PagedInvoicesResponseBody {
  data: InvoiceResponseBody[];
}

/**
 * Covers the "create an invoice, then verify it appears in the list"
 * workflow required by requirements.md §2.3.7. Requires a reachable
 * Postgres instance (e.g. `docker compose up -d db`) using the same env
 * vars the app reads outside Docker.
 */
describe('Invoices (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  const testUserEmail = `e2e-${Date.now()}@example.com`;
  const invoiceNumber = `IV-E2E-${Date.now()}`;

  // Always in the future relative to "now" so the invoice never derives to
  // Overdue regardless of when this suite runs.
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const futureInvoiceDate = toDateStr(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  const futureDueDate = toDateStr(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(getDataSourceToken());
    const userRepo = dataSource.getRepository(User);
    const passwordHash = await bcrypt.hash('E2ePassword123!', 10);
    await userRepo.save(
      userRepo.create({
        email: testUserEmail,
        passwordHash,
        fullname: 'E2E Tester',
      }),
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: 'E2ePassword123!' })
      .expect(200);
    accessToken = (loginResponse.body as AuthResponseBody).accessToken;
  });

  afterAll(async () => {
    await dataSource.getRepository(Invoice).delete({ invoiceNumber });
    await dataSource.getRepository(User).delete({ email: testUserEmail });
    await app.close();
  });

  it('creates an invoice, then finds it in the list and the detail view', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoiceNumber,
        invoiceDate: futureInvoiceDate,
        dueDate: futureDueDate,
        currency: 'AUD',
        currencySymbol: 'AU$',
        customer: {
          fullname: 'E2E Customer',
          email: 'e2e-customer@example.com',
        },
        item: { name: 'Test Widget', quantity: 3, rate: 50 },
        taxPercent: 10,
        discount: 0,
      })
      .expect(201);

    const created = createResponse.body as InvoiceResponseBody;
    expect(created.status).toBe('Draft');
    expect(created.invoiceSubTotal).toBe(150);
    expect(created.totalTax).toBe(15);
    expect(created.totalAmount).toBe(165);

    const invoiceId = created.invoiceId;

    const listResponse = await request(app.getHttpServer())
      .get(`/invoices?keyword=${invoiceNumber}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listBody = listResponse.body as PagedInvoicesResponseBody;
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].invoiceNumber).toBe(invoiceNumber);
    expect(listBody.data[0].totalAmount).toBe(165);

    const detailResponse = await request(app.getHttpServer())
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const detail = detailResponse.body as InvoiceResponseBody;
    expect(detail.invoiceNumber).toBe(invoiceNumber);
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0].name).toBe('Test Widget');
  });

  it('rejects a duplicate invoice number with 409', async () => {
    await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoiceNumber,
        invoiceDate: futureInvoiceDate,
        dueDate: futureDueDate,
        currency: 'AUD',
        currencySymbol: 'AU$',
        customer: {
          fullname: 'Another Customer',
          email: 'another@example.com',
        },
        item: { name: 'Other Widget', quantity: 1, rate: 10 },
      })
      .expect(409);
  });

  it('returns 401 without a token', async () => {
    await request(app.getHttpServer()).get('/invoices').expect(401);
  });
});
