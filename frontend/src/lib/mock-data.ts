import type { Invoice, PersistedStatus } from "@/types/invoice";

const DEFAULT_USER_ID = "ad1e0902-1928-4345-b513-60c86c94fc91";

// Deterministic PRNG so the seed dataset is stable across reloads.
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

function pick<T>(arr: T[]): T {
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
  email: string;
  mobileNumber?: string;
  address?: string;
}

const CUSTOMERS: CustomerSeed[] = [
  { fullname: "Paul", address: "Singapore", email: "paul@101digital.io", mobileNumber: "947717364111" },
  { fullname: "Kanglee Tan", address: "Singapore", email: "kanglee.tan@example.com", mobileNumber: "912345678" },
  { fullname: "Amara Okafor", address: "Lagos, Nigeria", email: "amara.okafor@example.com" },
  { fullname: "Liam Chen", address: "Melbourne, Australia", email: "liam.chen@example.com", mobileNumber: "412345678" },
  { fullname: "Sofia Ricci", address: "Milan, Italy", email: "sofia.ricci@example.com" },
  { fullname: "Noah Williams", address: "London, UK", email: "noah.williams@example.com", mobileNumber: "7911123456" },
  { fullname: "Hana Kobayashi", address: "Tokyo, Japan", email: "hana.kobayashi@example.com" },
  { fullname: "Diego Fernandez", address: "Madrid, Spain", email: "diego.fernandez@example.com" },
  { fullname: "Priya Sharma", address: "Bengaluru, India", email: "priya.sharma@example.com", mobileNumber: "9876543210" },
  { fullname: "Ethan Brown", address: "Auckland, New Zealand", email: "ethan.brown@example.com" },
  { fullname: "Mei Lin", address: "Kuala Lumpur, Malaysia", email: "mei.lin@example.com" },
  { fullname: "Oscar Dubois", address: "Paris, France", email: "oscar.dubois@example.com" },
  { fullname: "Grace Mensah", address: "Accra, Ghana", email: "grace.mensah@example.com" },
  { fullname: "Lucas Silva", address: "Sao Paulo, Brazil", email: "lucas.silva@example.com" },
  { fullname: "Ava Johnson", address: "Toronto, Canada", email: "ava.johnson@example.com" },
];

const ITEM_NAMES = [
  "Honda RC150",
  "Website Maintenance Package",
  "Cloud Hosting - Annual",
  "Consulting Services",
  "Office Furniture Set",
  "Marketing Campaign - Q3",
  "Software License - Enterprise",
  "Logistics & Freight Services",
  "Graphic Design Package",
  "Industrial Equipment Rental",
  "Catering Services",
  "Security System Installation",
];

const CURRENCIES: { currency: string; currencySymbol: string }[] = [
  { currency: "AUD", currencySymbol: "AU$" },
  { currency: "USD", currencySymbol: "$" },
  { currency: "GBP", currencySymbol: "£" },
  { currency: "SGD", currencySymbol: "S$" },
  { currency: "EUR", currencySymbol: "€" },
];

const STATUS_WEIGHTS: PersistedStatus[] = [
  "Draft", "Draft",
  "Pending", "Pending", "Pending", "Pending",
  "Paid", "Paid", "Paid", "Paid", "Paid",
];

function buildInvoice(index: number, today: Date): Invoice {
  const customer = pick(CUSTOMERS);
  const { currency, currencySymbol } = pick(CURRENCIES);
  const status = pick(STATUS_WEIGHTS);
  const itemName = pick(ITEM_NAMES);
  const quantity = randomInt(1, 12);
  const rate = randomInt(20, 2000);
  const taxPercent = pick([0, 5, 8, 10, 10, 10, 15]);
  const discount = pick([0, 0, 0, 10, 25, 50, 100]);

  // Spread invoice dates from ~90 days ago to ~30 days in the future.
  const invoiceOffset = randomInt(-90, 30);
  const invoiceDate = addDays(today, invoiceOffset);
  const dueOffset = randomInt(7, 45);
  const dueDate = addDays(invoiceDate, dueOffset);

  const subTotal = quantity * rate;
  const taxAmount = subTotal * (taxPercent / 100);
  const totalAmount = subTotal + taxAmount - discount;
  const totalPaid = status === "Paid" ? totalAmount : status === "Pending" ? Math.round(totalAmount * pick([0, 0, 0.25, 0.5])) : 0;
  const balanceAmount = totalAmount - totalPaid;

  const invoiceId = `9c1c9b${(1000 + index).toString(16)}-${index.toString().padStart(4, "0")}-4f2a-8b2e-000000000${(index % 10)}`;
  const invoiceNumber = `IV${1780000000000 + index * 137951}`;

  return {
    invoiceId,
    invoiceNumber,
    invoiceReference: `#${5700000 + index * 37}`,
    invoiceDate: toDateStr(invoiceDate),
    dueDate: toDateStr(dueDate),
    currency,
    currencySymbol,
    description: `Invoice is issued to ${customer.fullname}`,
    status,
    taxPercent,
    customer,
    items: [
      {
        id: `b1c2d3e4-0000-0000-0000-${index.toString().padStart(12, "0")}`,
        invoiceId,
        name: itemName,
        quantity,
        rate,
      },
    ],
    invoiceSubTotal: subTotal,
    totalTax: taxAmount,
    totalDiscount: discount,
    totalAmount,
    totalPaid,
    balanceAmount,
    createdAt: new Date(invoiceDate.getTime() - 1000 * 60 * 60).toISOString(),
    createdBy: DEFAULT_USER_ID,
  };
}

export function generateMockInvoices(today: Date = new Date()): Invoice[] {
  const count = 42;
  const invoices: Invoice[] = [];
  for (let i = 1; i <= count; i++) {
    invoices.push(buildInvoice(i, today));
  }
  return invoices;
}
