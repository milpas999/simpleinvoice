import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "@/store/authSlice";
import invoicesReducer from "@/store/invoicesSlice";

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      invoices: invoicesReducer,
    },
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderOptions {
  route?: string;
  store?: TestStore;
}

export function renderWithProviders(ui: ReactElement, { route = "/", store = createTestStore() }: RenderOptions = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper }) };
}
