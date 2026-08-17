import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/pages/LoginPage";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  TOKEN_STORAGE_KEY: "simpleinvoice.accessToken",
  injectStore: vi.fn(),
}));

import { api } from "@/lib/api";

function renderLoginPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invoices" element={<div>Invoices Page</div>} />
    </Routes>,
    { route: "/login" },
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    localStorage.clear();
  });

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("navigates to /invoices on successful login", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: "token-123",
        expiresIn: 3600,
        user: { id: "u1", email: "reviewer@simpleinvoice.dev", fullname: "Reviewer" },
      },
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), "reviewer@simpleinvoice.dev");
    await user.type(screen.getByLabelText(/password/i), "Reviewer123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invoices Page")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "reviewer@simpleinvoice.dev",
      password: "Reviewer123!",
    });
  });

  it("shows a form-level error banner when login is rejected", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Request failed"));

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), "reviewer@simpleinvoice.dev");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Invoices Page")).not.toBeInTheDocument());
  });
});
