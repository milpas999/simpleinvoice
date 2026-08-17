import { ArrowLeftIcon, FileQuestionIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { fetchInvoiceByIdThunk, selectInvoiceDetail } from "@/store/invoicesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function LineRow({ label, value, emphasis }: { label: string; value: string; emphasis?: "muted" | "strong" }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={emphasis === "strong" ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={emphasis === "strong" ? "text-base font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const dispatch = useAppDispatch();
  const { invoice, status } = useAppSelector(selectInvoiceDetail);

  useEffect(() => {
    if (invoiceId) {
      void dispatch(fetchInvoiceByIdThunk(invoiceId));
    }
  }, [dispatch, invoiceId]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading invoice…
      </div>
    );
  }

  if (!invoice) {
    return <InvoiceNotFoundPage />;
  }

  const currency = (amount: number) => formatCurrency(amount, invoice.currencySymbol);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/invoices" aria-label="Back to invoices">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.invoiceReference ? `Ref ${invoice.invoiceReference}` : "Invoice details"}
            </p>
          </div>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Invoice date</p>
                <p className="text-sm font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due date</p>
                <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="text-sm font-medium">
                  {invoice.currency} ({invoice.currencySymbol})
                </p>
              </div>
              {invoice.description && (
                <div className="sm:col-span-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm font-medium">{invoice.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(item.rate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(item.quantity * item.rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="font-medium">{invoice.customer.fullname}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MailIcon data-icon="inline-start" className="size-3.5" />
                <span className="truncate">{invoice.customer.email}</span>
              </div>
              {invoice.customer.mobileNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon data-icon="inline-start" className="size-3.5" />
                  <span>{invoice.customer.mobileNumber}</span>
                </div>
              )}
              {invoice.customer.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinIcon data-icon="inline-start" className="size-3.5" />
                  <span>{invoice.customer.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amount summary</CardTitle>
            </CardHeader>
            <CardContent>
              <LineRow label="Subtotal" value={currency(invoice.invoiceSubTotal)} />
              <LineRow label={`Tax (${invoice.taxPercent}%)`} value={currency(invoice.totalTax)} />
              <LineRow label="Discount" value={`-${currency(invoice.totalDiscount)}`} />
              <Separator className="my-2" />
              <LineRow label="Total amount" value={currency(invoice.totalAmount)} emphasis="strong" />
              <LineRow label="Amount paid" value={currency(invoice.totalPaid)} />
              <Separator className="my-2" />
              <LineRow label="Outstanding balance" value={currency(invoice.balanceAmount)} emphasis="strong" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function InvoiceNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <FileQuestionIcon className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <p className="text-sm text-muted-foreground">The invoice you're looking for doesn't exist.</p>
      </div>
      <Button asChild>
        <Link to="/invoices">Back to invoices</Link>
      </Button>
    </div>
  );
}
