import { calculateTotals } from './calculate-totals.util';

describe('calculateTotals', () => {
  it('computes subTotal, taxAmount, totalAmount and balanceAmount per the documented formulas', () => {
    const result = calculateTotals({
      quantity: 2,
      rate: 1000,
      taxPercent: 10,
      discount: 20,
      totalPaid: 1451.34,
    });

    expect(result.subTotal).toBe(2000);
    expect(result.taxAmount).toBe(200);
    expect(result.totalAmount).toBe(2180);
    expect(result.balanceAmount).toBeCloseTo(728.66);
  });

  it('defaults totalPaid to 0 when omitted', () => {
    const result = calculateTotals({
      quantity: 1,
      rate: 100,
      taxPercent: 0,
      discount: 0,
    });

    expect(result.totalAmount).toBe(100);
    expect(result.balanceAmount).toBe(100);
  });
});
