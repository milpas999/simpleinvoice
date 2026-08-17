// Deterministic PRNG so reruns generate the same records (mirrors the
// approach used by the frontend's old mock-data generator).
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(101101);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface CustomerSeed {
  fullname: string;
  address?: string;
  email: string;
  mobileNumber?: string;
}

const CUSTOMERS: CustomerSeed[] = [
  {
    fullname: 'Paul',
    address: 'Singapore',
    email: 'paul@101digital.io',
    mobileNumber: '947717364111',
  },
  {
    fullname: 'Kanglee Tan',
    address: 'Singapore',
    email: 'kanglee.tan@example.com',
    mobileNumber: '912345678',
  },
  {
    fullname: 'Amara Okafor',
    address: 'Lagos, Nigeria',
    email: 'amara.okafor@example.com',
  },
  {
    fullname: 'Liam Chen',
    address: 'Melbourne, Australia',
    email: 'liam.chen@example.com',
    mobileNumber: '412345678',
  },
  {
    fullname: 'Sofia Ricci',
    address: 'Milan, Italy',
    email: 'sofia.ricci@example.com',
  },
  {
    fullname: 'Noah Williams',
    address: 'London, UK',
    email: 'noah.williams@example.com',
    mobileNumber: '7911123456',
  },
  {
    fullname: 'Hana Kobayashi',
    address: 'Tokyo, Japan',
    email: 'hana.kobayashi@example.com',
  },
  {
    fullname: 'Diego Fernandez',
    address: 'Madrid, Spain',
    email: 'diego.fernandez@example.com',
  },
  {
    fullname: 'Priya Sharma',
    address: 'Bengaluru, India',
    email: 'priya.sharma@example.com',
    mobileNumber: '9876543210',
  },
  {
    fullname: 'Ethan Brown',
    address: 'Auckland, New Zealand',
    email: 'ethan.brown@example.com',
  },
  {
    fullname: 'Mei Lin',
    address: 'Kuala Lumpur, Malaysia',
    email: 'mei.lin@example.com',
  },
  {
    fullname: 'Oscar Dubois',
    address: 'Paris, France',
    email: 'oscar.dubois@example.com',
  },
  {
    fullname: 'Grace Mensah',
    address: 'Accra, Ghana',
    email: 'grace.mensah@example.com',
  },
  {
    fullname: 'Lucas Silva',
    address: 'Sao Paulo, Brazil',
    email: 'lucas.silva@example.com',
  },
  {
    fullname: 'Ava Johnson',
    address: 'Toronto, Canada',
    email: 'ava.johnson@example.com',
  },
];

const ITEM_NAMES = [
  'Honda RC150',
  'Website Maintenance Package',
  'Cloud Hosting - Annual',
  'Consulting Services',
  'Office Furniture Set',
  'Marketing Campaign - Q3',
  'Software License - Enterprise',
  'Logistics & Freight Services',
  'Graphic Design Package',
  'Industrial Equipment Rental',
  'Catering Services',
  'Security System Installation',
];

const CURRENCIES: { currency: string; currencySymbol: string }[] = [
  { currency: 'AUD', currencySymbol: 'AU$' },
  { currency: 'USD', currencySymbol: '$' },
  { currency: 'GBP', currencySymbol: '£' },
  { currency: 'SGD', currencySymbol: 'S$' },
  { currency: 'EUR', currencySymbol: '€' },
];

const STATUS_WEIGHTS = [
  'Draft',
  'Draft',
  'Pending',
  'Pending',
  'Pending',
  'Pending',
  'Paid',
  'Paid',
  'Paid',
  'Paid',
  'Paid',
] as const;

export interface SeedInvoice {
  invoiceNumber: string;
  invoiceReference: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description: string;
  status: 'Draft' | 'Pending' | 'Paid';
  taxPercent: number;
  customerFullname: string;
  customerEmail: string;
  customerMobileNumber?: string;
  customerAddress?: string;
  invoiceSubTotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  item: { name: string; quantity: number; rate: number };
}

function buildInvoice(index: number, today: Date): SeedInvoice {
  const customer = pick(CUSTOMERS);
  const { currency, currencySymbol } = pick(CURRENCIES);
  const status = pick(STATUS_WEIGHTS);
  const itemName = pick(ITEM_NAMES);
  const quantity = randomInt(1, 12);
  const rate = randomInt(20, 2000);
  const taxPercent = pick([0, 5, 8, 10, 10, 10, 15]);
  const discount = pick([0, 0, 0, 10, 25, 50, 100]);

  // Spread invoice dates from ~90 days ago to ~30 days in the future, so both
  // overdue (past due date) and not-yet-due invoices are represented.
  const invoiceOffset = randomInt(-90, 30);
  const invoiceDate = addDays(today, invoiceOffset);
  const dueOffset = randomInt(7, 45);
  const dueDate = addDays(invoiceDate, dueOffset);

  const subTotal = quantity * rate;
  const taxAmount = subTotal * (taxPercent / 100);
  const totalAmount = subTotal + taxAmount - discount;
  const totalPaid =
    status === 'Paid'
      ? totalAmount
      : status === 'Pending'
        ? Math.round(totalAmount * pick([0, 0, 0.25, 0.5]))
        : 0;
  const balanceAmount = totalAmount - totalPaid;

  return {
    invoiceNumber: `IV${1780000000000 + index * 137951}`,
    invoiceReference: `#${5700000 + index * 37}`,
    invoiceDate: toDateStr(invoiceDate),
    dueDate: toDateStr(dueDate),
    currency,
    currencySymbol,
    description: `Invoice is issued to ${customer.fullname}`,
    status,
    taxPercent,
    customerFullname: customer.fullname,
    customerEmail: customer.email,
    customerMobileNumber: customer.mobileNumber,
    customerAddress: customer.address,
    invoiceSubTotal: subTotal,
    totalTax: taxAmount,
    totalDiscount: discount,
    totalAmount,
    totalPaid,
    balanceAmount,
    item: { name: itemName, quantity, rate },
  };
}

export function generateSeedInvoices(
  count: number,
  today: Date = new Date(),
): SeedInvoice[] {
  const invoices: SeedInvoice[] = [];
  for (let i = 1; i <= count; i++) {
    invoices.push(buildInvoice(i, today));
  }
  return invoices;
}
