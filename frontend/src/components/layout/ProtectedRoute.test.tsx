import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { createTestStore, renderWithProviders, type TestStore } from "@/test/render-with-providers";

function renderProtected(store: TestStore = createTestStore()) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/invoices" element={<div>Invoices Page</div>} />
      </Route>
    </Routes>,
    { route: "/invoices", store },
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when unauthenticated", () => {
    renderProtected();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders the nested route when authenticated", () => {
    const store = createTestStore();
    // Seed auth state the same way loginThunk.fulfilled would, without a real API call.
    store.dispatch({
      type: "auth/login/fulfilled",
      payload: {
        accessToken: "token-123",
        expiresIn: 3600,
        user: { id: "u1", email: "reviewer@simpleinvoice.dev", fullname: "Reviewer" },
      },
    });

    renderProtected(store);
    expect(screen.getByText("Invoices Page")).toBeInTheDocument();
  });
});
