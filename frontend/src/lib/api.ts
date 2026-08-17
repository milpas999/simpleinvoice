import axios from "axios";

export const TOKEN_STORAGE_KEY = "simpleinvoice.accessToken";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Avoids a circular import between this module and the Redux store (the
// store needs `api` for thunks; `api` needs the store to dispatch a logout
// on 401). The store calls injectStore(store) once, right after creation.
interface DispatchLike {
  dispatch: (action: { type: string }) => void;
}

let injectedStore: DispatchLike | null = null;

export function injectStore(store: DispatchLike): void {
  injectedStore = store;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      injectedStore?.dispatch({ type: "auth/sessionExpired" });
    }
    return Promise.reject(error);
  },
);
