import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from './entities/invoice-status.enum';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: jest.Mocked<InvoicesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: InvoicesRepository,
          useValue: {
            findPaged: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(InvoicesService);
    repository = module.get(InvoicesRepository);
  });

  describe('getById', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const baseDto: CreateInvoiceDto = {
      invoiceNumber: 'IV-TEST-001',
      invoiceDate: '2026-01-01',
      dueDate: '2026-01-15',
      currency: 'AUD',
      currencySymbol: 'AU$',
      customer: { fullname: 'Test Customer', email: 'test@example.com' },
      item: { name: 'Widget', quantity: 2, rate: 100 },
      taxPercent: 10,
      discount: 20,
    };

    it('computes totals using the documented server-side formulas', async () => {
      repository.create.mockImplementation((data) =>
        Promise.resolve(data as never),
      );

      const result = await service.create(baseDto, 'user-id');

      // subTotal = 2 * 100 = 200; tax = 200 * 0.10 = 20; total = 200 + 20 - 20 = 200
      expect(result.invoiceSubTotal).toBe(200);
      expect(result.totalTax).toBe(20);
      expect(result.totalAmount).toBe(200);
      expect(result.totalPaid).toBe(0);
      expect(result.balanceAmount).toBe(200);
    });

    it('always forces status to Draft regardless of input', async () => {
      repository.create.mockImplementation((data) =>
        Promise.resolve(data as never),
      );
      await service.create(baseDto, 'user-id');
      // eslint-disable-next-line @typescript-eslint/unbound-method -- repository.create is a jest mock, not a bound instance method
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.Draft }),
      );
    });

    it('translates a unique-constraint violation into a ConflictException', async () => {
      repository.create.mockRejectedValue({ code: '23505' });
      await expect(service.create(baseDto, 'user-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
