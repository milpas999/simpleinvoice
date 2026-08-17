import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { fetchMeThunk, selectHasStoredToken } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CreateInvoicePage } from "@/pages/CreateInvoicePage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { InvoiceListPage } from "@/pages/InvoiceListPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function IndexRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/invoices" : "/login"} replace />;
}

function App() {
  const dispatch = useAppDispatch();
  const hasStoredToken = useAppSelector(selectHasStoredToken);
  // Nothing to rehydrate if there's no stored token — skip the loading gate.
  const [bootstrapped, setBootstrapped] = useState(!hasStoredToken);

  useEffect(() => {
    if (!hasStoredToken || bootstrapped) return;
    void dispatch(fetchMeThunk()).finally(() => setBootstrapped(true));
  }, [dispatch, hasStoredToken, bootstrapped]);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/new" element={<CreateInvoicePage />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
