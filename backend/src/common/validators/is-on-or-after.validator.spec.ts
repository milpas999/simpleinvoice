import { validate } from 'class-validator';
import { IsOnOrAfter } from './is-on-or-after.validator';

class DateRangeFixture {
  invoiceDate: string;

  @IsOnOrAfter('invoiceDate', {
    message: 'dueDate must be on or after invoiceDate',
  })
  dueDate: string;
}

function makeFixture(invoiceDate: string, dueDate: string): DateRangeFixture {
  const fixture = new DateRangeFixture();
  fixture.invoiceDate = invoiceDate;
  fixture.dueDate = dueDate;
  return fixture;
}

describe('IsOnOrAfter', () => {
  it('fails when dueDate is before invoiceDate', async () => {
    const errors = await validate(makeFixture('2026-06-10', '2026-06-01'));
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isOnOrAfter: 'dueDate must be on or after invoiceDate',
    });
  });

  it('passes when dueDate equals invoiceDate', async () => {
    const errors = await validate(makeFixture('2026-06-10', '2026-06-10'));
    expect(errors).toHaveLength(0);
  });

  it('passes when dueDate is after invoiceDate', async () => {
    const errors = await validate(makeFixture('2026-06-10', '2026-07-01'));
    expect(errors).toHaveLength(0);
  });
});
