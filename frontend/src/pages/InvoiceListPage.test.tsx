import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceListPage } from "@/pages/InvoiceListPage";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  TOKEN_STORAGE_KEY: "simpleinvoice.accessToken",
  injectStore: vi.fn(),
}));

import { api } from "@/lib/api";

describe("InvoiceListPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("renders invoice rows and paging summary from the API response", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: [
          {
            invoiceId: "inv-1",
            invoiceNumber: "IV-1001",
            customer: { fullname: "Paul", email: "paul@example.com" },
            invoiceDate: "2026-01-01",
            dueDate: "2026-01-15",
            currency: "AUD",
            currencySymbol: "AU$",
            status: "Paid",
            totalAmount: 199.5,
            items: [],
          },
        ],
        paging: { page: 1, pageSize: 10, total: 1 },
      },
    });

    renderWithProviders(<InvoiceListPage />, { route: "/invoices" });

    expect(await screen.findByText("IV-1001")).toBeInTheDocument();
    expect(screen.getByText("Paul")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      "/invoices",
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, pageSize: 10, sortBy: "invoiceDate", ordering: "DESC" }),
      }),
    );
  });

  it("shows an empty state when there are no invoices", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: [], paging: { page: 1, pageSize: 10, total: 0 } },
    });

    renderWithProviders(<InvoiceListPage />, { route: "/invoices" });

    expect(await screen.findByText("No invoices found")).toBeInTheDocument();
  });
});
