import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatCurrency } from "@/lib/calculations";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { renderWithProviders } from "@/test/render-with-providers";
import type { Invoice } from "@/types/invoice";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  TOKEN_STORAGE_KEY: "simpleinvoice.accessToken",
  injectStore: vi.fn(),
}));

import { api } from "@/lib/api";

const sampleInvoice: Invoice = {
  invoiceId: "099ca7da-a290-40fa-93b9-1c43ae7bb887",
  invoiceNumber: "IV1780488206995",
  invoiceReference: "#5721662",
  invoiceDate: "2026-06-03",
  dueDate: "2026-07-03",
  currency: "AUD",
  currencySymbol: "AU$",
  description: "Invoice is issued to Kanglee",
  status: "Paid",
  taxPercent: 10,
  customer: {
    fullname: "Paul",
    email: "paul@101digital.io",
    mobileNumber: "947717364111",
    address: "Singapore",
  },
  items: [
    {
      id: "b1c2d3e4-0000-0000-0000-000000000001",
      invoiceId: "099ca7da-a290-40fa-93b9-1c43ae7bb887",
      name: "Honda RC150",
      quantity: 2,
      rate: 1000,
    },
  ],
  invoiceSubTotal: 2000,
  totalTax: 200,
  totalDiscount: 20,
  totalAmount: 2180,
  totalPaid: 1451.34,
  balanceAmount: 728.66,
  createdAt: "2026-06-03T12:03:26.995Z",
  createdBy: "ad1e0902-1928-4345-b513-60c86c94fc91",
};

function renderDetailPage(invoiceId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
    </Routes>,
    { route: `/invoices/${invoiceId}` },
  );
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("renders invoice, customer, line item, and amount summary details from the API response", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: sampleInvoice });

    renderDetailPage(sampleInvoice.invoiceId);

    expect(await screen.findByText("IV1780488206995")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(`/invoices/${sampleInvoice.invoiceId}`);

    // Invoice information
    expect(screen.getByText("AUD (AU$)")).toBeInTheDocument();

    // Customer information
    expect(screen.getByText("Paul")).toBeInTheDocument();
    expect(screen.getByText("paul@101digital.io")).toBeInTheDocument();
    expect(screen.getByText("947717364111")).toBeInTheDocument();
    expect(screen.getByText("Singapore")).toBeInTheDocument();

    // Line item
    expect(screen.getByText("Honda RC150")).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(1000, "AU$"))).toBeInTheDocument(); // rate

    // Amount summary — subtotal/item-amount both equal quantity x rate (2000)
    expect(screen.getAllByText(formatCurrency(2000, "AU$")).length).toBe(2);
    expect(screen.getByText(formatCurrency(200, "AU$"))).toBeInTheDocument(); // tax amount
    expect(screen.getByText(`-${formatCurrency(20, "AU$")}`)).toBeInTheDocument(); // discount
    expect(screen.getByText(formatCurrency(2180, "AU$"))).toBeInTheDocument(); // total amount
    expect(screen.getByText(formatCurrency(1451.34, "AU$"))).toBeInTheDocument(); // amount paid
    expect(screen.getByText(formatCurrency(728.66, "AU$"))).toBeInTheDocument(); // outstanding balance

    // Status badge
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows a not-found state when the invoice cannot be loaded", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { statusCode: 404, message: "Invoice not found", error: "Not Found" } },
    });

    renderDetailPage("missing-id");

    expect(await screen.findByText("Invoice not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to invoices/i })).toBeInTheDocument();
  });
});
