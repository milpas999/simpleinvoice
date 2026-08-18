import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "@/lib/api";
import type { ApiErrorBody } from "@/types/api";
import type {
  CalculatedTotals,
  CalculateTotalsPayload,
  CreateInvoicePayload,
  Invoice,
  InvoiceListParams,
  InvoiceListResult,
  Paging,
} from "@/types/invoice";
import type { RootState } from "./index";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface InvoicesState {
  list: {
    data: Invoice[];
    paging: Paging;
    status: RequestStatus;
    error: string | null;
  };
  detail: {
    invoice: Invoice | null;
    status: RequestStatus;
    error: string | null;
  };
  create: {
    status: RequestStatus;
    error: ApiErrorBody | null;
  };
  preview: {
    totals: CalculatedTotals;
    status: RequestStatus;
  };
}

const zeroTotals: CalculatedTotals = { subTotal: 0, taxAmount: 0, totalAmount: 0, balanceAmount: 0 };

const initialState: InvoicesState = {
  list: { data: [], paging: { page: 1, pageSize: 10, total: 0 }, status: "idle", error: null },
  detail: { invoice: null, status: "idle", error: null },
  create: { status: "idle", error: null },
  preview: { totals: zeroTotals, status: "idle" },
};

function toApiErrorBody(error: unknown): ApiErrorBody | undefined {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data as ApiErrorBody;
  }
  return undefined;
}

export const fetchInvoicesThunk = createAsyncThunk<InvoiceListResult, InvoiceListParams>(
  "invoices/fetchList",
  async (params) => {
    const query: Record<string, string | number> = {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      ordering: params.ordering,
    };
    if (params.status && params.status !== "All") query.status = params.status;
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;

    const { data } = await api.get<InvoiceListResult>("/invoices", { params: query });
    return data;
  },
);

export const fetchInvoiceByIdThunk = createAsyncThunk<Invoice, string, { rejectValue: ApiErrorBody }>(
  "invoices/fetchById",
  async (invoiceId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Invoice>(`/invoices/${invoiceId}`);
      return data;
    } catch (error) {
      const body = toApiErrorBody(error);
      if (body) return rejectWithValue(body);
      throw error;
    }
  },
);

export const createInvoiceThunk = createAsyncThunk<Invoice, CreateInvoicePayload, { rejectValue: ApiErrorBody }>(
  "invoices/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Invoice>("/invoices", payload);
      return data;
    } catch (error) {
      const body = toApiErrorBody(error);
      if (body) return rejectWithValue(body);
      throw error;
    }
  },
);

export const calculateTotalsThunk = createAsyncThunk<CalculatedTotals, CalculateTotalsPayload>(
  "invoices/calculateTotals",
  async (payload) => {
    const { data } = await api.post<CalculatedTotals>("/invoices/calculate-totals", payload);
    return data;
  },
);

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.create.status = "idle";
      state.create.error = null;
    },
    resetPreviewTotals(state) {
      state.preview.totals = zeroTotals;
      state.preview.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoicesThunk.pending, (state) => {
        state.list.status = "loading";
        state.list.error = null;
      })
      .addCase(fetchInvoicesThunk.fulfilled, (state, action: PayloadAction<InvoiceListResult>) => {
        state.list.status = "succeeded";
        state.list.data = action.payload.data;
        state.list.paging = action.payload.paging;
      })
      .addCase(fetchInvoicesThunk.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error = action.error.message ?? "Failed to load invoices";
      })
      .addCase(fetchInvoiceByIdThunk.pending, (state) => {
        state.detail.status = "loading";
        state.detail.error = null;
        state.detail.invoice = null;
      })
      .addCase(fetchInvoiceByIdThunk.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.detail.status = "succeeded";
        state.detail.invoice = action.payload;
      })
      .addCase(fetchInvoiceByIdThunk.rejected, (state, action) => {
        state.detail.status = "failed";
        const message = action.payload?.message;
        state.detail.error = Array.isArray(message) ? (message[0] ?? "Invoice not found") : (message ?? "Invoice not found");
      })
      .addCase(createInvoiceThunk.pending, (state) => {
        state.create.status = "loading";
        state.create.error = null;
      })
      .addCase(createInvoiceThunk.fulfilled, (state) => {
        state.create.status = "succeeded";
      })
      .addCase(createInvoiceThunk.rejected, (state, action) => {
        state.create.status = "failed";
        state.create.error = action.payload ?? {
          statusCode: 0,
          message: action.error.message ?? "Failed to create invoice",
          error: "Error",
        };
      })
      .addCase(calculateTotalsThunk.pending, (state) => {
        state.preview.status = "loading";
      })
      .addCase(calculateTotalsThunk.fulfilled, (state, action: PayloadAction<CalculatedTotals>) => {
        state.preview.status = "succeeded";
        state.preview.totals = action.payload;
      })
      .addCase(calculateTotalsThunk.rejected, (state) => {
        state.preview.status = "failed";
      });
  },
});

export const { resetCreateStatus, resetPreviewTotals } = invoicesSlice.actions;
export default invoicesSlice.reducer;

export const selectInvoiceList = (state: RootState) => state.invoices.list;
export const selectInvoiceDetail = (state: RootState) => state.invoices.detail;
export const selectCreateStatus = (state: RootState) => state.invoices.create;
export const selectPreviewTotals = (state: RootState) => state.invoices.preview;
