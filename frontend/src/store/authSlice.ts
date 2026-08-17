import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api, TOKEN_STORAGE_KEY } from "@/lib/api";
import type { AuthResponse, LoginRequest, User } from "@/types/auth";
import type { RootState } from "./index";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface AuthState {
  user: User | null;
  token: string | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  status: "idle",
  error: null,
};

export const loginThunk = createAsyncThunk<AuthResponse, LoginRequest>("auth/login", async (credentials) => {
  const { data } = await api.post<AuthResponse>("/auth/login", credentials);
  return data;
});

export const fetchMeThunk = createAsyncThunk<User>("auth/me", async () => {
  const { data } = await api.get<User>("/auth/me");
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    },
    sessionExpired(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.accessToken);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(fetchMeThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        // Stored token is invalid/expired — clear the stale session.
        state.user = null;
        state.token = null;
        state.status = "idle";
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      });
  },
});

export const { logout, sessionExpired } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: RootState): User | null => state.auth.user;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.user !== null;
export const selectHasStoredToken = (state: RootState): boolean => state.auth.token !== null;
export const selectAuthStatus = (state: RootState): RequestStatus => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
