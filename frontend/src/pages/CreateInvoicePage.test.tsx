import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateInvoicePage } from "@/pages/CreateInvoicePage";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  TOKEN_STORAGE_KEY: "simpleinvoice.accessToken",
  injectStore: vi.fn(),
}));

import { api } from "@/lib/api";

function renderCreateInvoicePage() {
  return renderWithProviders(
    <Routes>
      <Route path="/invoices/new" element={<CreateInvoicePage />} />
      <Route path="/invoices" element={<div>Invoices Page</div>} />
    </Routes>,
    { route: "/invoices/new" },
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/customer name/i), "Acme Co");
  await user.type(screen.getByLabelText(/customer email/i), "billing@acme.test");
  await user.type(screen.getByLabelText(/invoice number/i), "IV-TEST-0001");
  fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: "2099-01-01" } });
  await user.type(screen.getByLabelText(/item name/i), "Widget");
  await user.type(screen.getByLabelText(/^rate$/i), "50");
}

describe("CreateInvoicePage", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("blocks submission and shows validation errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderCreateInvoicePage();

    await user.click(screen.getByRole("button", { name: /save invoice/i }));

    expect(await screen.findByText("Customer name is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer email is required.")).toBeInTheDocument();
    expect(screen.getByText("Invoice number is required.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("maps a 409 duplicate invoice number response onto the invoiceNumber field", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { statusCode: 409, message: 'Invoice number "IV-TEST-0001" already exists', error: "Conflict" },
      },
    });

    const user = userEvent.setup();
    renderCreateInvoicePage();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: /save invoice/i }));

    expect(await screen.findByText('Invoice number "IV-TEST-0001" already exists')).toBeInTheDocument();
    expect(screen.queryByText("Invoices Page")).not.toBeInTheDocument();
  });

  it("navigates to the invoice list on successful creation", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { invoiceId: "inv-1", invoiceNumber: "IV-TEST-0001", status: "Draft" },
    });

    const user = userEvent.setup();
    renderCreateInvoicePage();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: /save invoice/i }));

    expect(await screen.findByText("Invoices Page")).toBeInTheDocument();
  });
});
