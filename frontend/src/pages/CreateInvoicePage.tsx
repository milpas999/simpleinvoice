import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useInvoices } from "@/hooks/use-invoices";
import { calculateTotals, formatCurrency } from "@/lib/calculations";
import { DuplicateInvoiceNumberError } from "@/lib/invoice-errors";
import { isNonEmpty, isOnOrAfter, isValidDateString, isValidEmail } from "@/lib/validation";

const CURRENCIES = [
  { currency: "AUD", currencySymbol: "AU$" },
  { currency: "USD", currencySymbol: "$" },
  { currency: "GBP", currencySymbol: "£" },
  { currency: "SGD", currencySymbol: "S$" },
  { currency: "EUR", currencySymbol: "€" },
];

interface FormState {
  customerFullname: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  itemName: string;
  itemQuantity: string;
  itemRate: string;
  taxPercent: string;
  discount: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL_STATE: FormState = {
  customerFullname: "",
  customerEmail: "",
  customerMobile: "",
  customerAddress: "",
  invoiceNumber: "",
  invoiceDate: todayStr(),
  dueDate: "",
  currency: "AUD",
  itemName: "",
  itemQuantity: "1",
  itemRate: "",
  taxPercent: "10",
  discount: "0",
};

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addInvoice, isInvoiceNumberTaken } = useInvoices();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(values: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!isNonEmpty(values.customerFullname)) {
      nextErrors.customerFullname = "Customer name is required.";
    }

    if (!isNonEmpty(values.customerEmail)) {
      nextErrors.customerEmail = "Customer email is required.";
    } else if (!isValidEmail(values.customerEmail)) {
      nextErrors.customerEmail = "Enter a valid email address.";
    }

    if (!isNonEmpty(values.invoiceNumber)) {
      nextErrors.invoiceNumber = "Invoice number is required.";
    } else if (isInvoiceNumberTaken(values.invoiceNumber)) {
      nextErrors.invoiceNumber = "This invoice number already exists.";
    }

    if (!isValidDateString(values.invoiceDate)) {
      nextErrors.invoiceDate = "Enter a valid invoice date.";
    }

    if (!isValidDateString(values.dueDate)) {
      nextErrors.dueDate = "Enter a valid due date.";
    } else if (isValidDateString(values.invoiceDate) && !isOnOrAfter(values.dueDate, values.invoiceDate)) {
      nextErrors.dueDate = "Due date must be on or after the invoice date.";
    }

    if (!isNonEmpty(values.currency)) {
      nextErrors.currency = "Currency is required.";
    }

    if (!isNonEmpty(values.itemName)) {
      nextErrors.itemName = "Item name is required.";
    }

    const quantity = Number(values.itemQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      nextErrors.itemQuantity = "Quantity must be a positive integer.";
    }

    const rate = Number(values.itemRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      nextErrors.itemRate = "Rate must be a positive number.";
    }

    const taxPercent = Number(values.taxPercent);
    if (!Number.isFinite(taxPercent) || taxPercent < 0) {
      nextErrors.taxPercent = "Tax must be zero or a positive number.";
    }

    const discount = Number(values.discount);
    if (!Number.isFinite(discount) || discount < 0) {
      nextErrors.discount = "Discount must be zero or a positive number.";
    }

    return nextErrors;
  }

  const preview = useMemo(() => {
    const quantity = Number(form.itemQuantity);
    const rate = Number(form.itemRate);
    const taxPercent = Number(form.taxPercent);
    const discount = Number(form.discount);

    return calculateTotals({
      quantity: Number.isFinite(quantity) ? quantity : 0,
      rate: Number.isFinite(rate) ? rate : 0,
      taxPercent: Number.isFinite(taxPercent) ? taxPercent : 0,
      discount: Number.isFinite(discount) ? discount : 0,
      totalPaid: 0,
    });
  }, [form.itemQuantity, form.itemRate, form.taxPercent, form.discount]);

  const currencySymbol = CURRENCIES.find((c) => c.currency === form.currency)?.currencySymbol ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCurrency = CURRENCIES.find((c) => c.currency === form.currency) ?? CURRENCIES[0];

      const created = addInvoice({
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        currency: selectedCurrency.currency,
        currencySymbol: selectedCurrency.currencySymbol,
        customer: {
          fullname: form.customerFullname.trim(),
          email: form.customerEmail.trim(),
          mobileNumber: form.customerMobile.trim() || undefined,
          address: form.customerAddress.trim() || undefined,
        },
        item: {
          name: form.itemName.trim(),
          quantity: Number(form.itemQuantity),
          rate: Number(form.itemRate),
        },
        taxPercent: Number(form.taxPercent),
        discount: Number(form.discount),
        createdBy: user?.id ?? "unknown",
      });

      toast.success("Invoice created", {
        description: `${created.invoiceNumber} was saved as a draft.`,
      });
      navigate("/invoices");
    } catch (error) {
      if (error instanceof DuplicateInvoiceNumberError) {
        setErrors((prev) => ({ ...prev, invoiceNumber: error.message }));
      } else {
        toast.error("Something went wrong while creating the invoice.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/invoices" aria-label="Back to invoices">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
          <p className="text-sm text-muted-foreground">New invoices are always created with Draft status.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={!!errors.customerFullname || undefined}>
                    <FieldLabel htmlFor="customerFullname">Customer name</FieldLabel>
                    <Input
                      id="customerFullname"
                      value={form.customerFullname}
                      aria-invalid={!!errors.customerFullname}
                      onChange={(e) => setField("customerFullname", e.target.value)}
                    />
                    <FieldError>{errors.customerFullname}</FieldError>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.customerEmail || undefined}>
                      <FieldLabel htmlFor="customerEmail">Customer email</FieldLabel>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={form.customerEmail}
                        aria-invalid={!!errors.customerEmail}
                        onChange={(e) => setField("customerEmail", e.target.value)}
                      />
                      <FieldError>{errors.customerEmail}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="customerMobile">Customer mobile</FieldLabel>
                      <Input
                        id="customerMobile"
                        type="tel"
                        value={form.customerMobile}
                        onChange={(e) => setField("customerMobile", e.target.value)}
                      />
                      <FieldDescription>Optional.</FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="customerAddress">Customer address</FieldLabel>
                    <Input
                      id="customerAddress"
                      value={form.customerAddress}
                      onChange={(e) => setField("customerAddress", e.target.value)}
                    />
                    <FieldDescription>Optional.</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice details</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.invoiceNumber || undefined}>
                      <FieldLabel htmlFor="invoiceNumber">Invoice number</FieldLabel>
                      <Input
                        id="invoiceNumber"
                        value={form.invoiceNumber}
                        aria-invalid={!!errors.invoiceNumber}
                        onChange={(e) => setField("invoiceNumber", e.target.value)}
                      />
                      <FieldError>{errors.invoiceNumber}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.currency || undefined}>
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <Select value={form.currency} onValueChange={(v) => setField("currency", v)}>
                        <SelectTrigger id="currency" className="w-full" aria-invalid={!!errors.currency}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.currency} value={c.currency}>
                              {c.currency} ({c.currencySymbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError>{errors.currency}</FieldError>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.invoiceDate || undefined}>
                      <FieldLabel htmlFor="invoiceDate">Invoice date</FieldLabel>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={form.invoiceDate}
                        aria-invalid={!!errors.invoiceDate}
                        onChange={(e) => setField("invoiceDate", e.target.value)}
                      />
                      <FieldError>{errors.invoiceDate}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.dueDate || undefined}>
                      <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
                      <Input
                        id="dueDate"
                        type="date"
                        value={form.dueDate}
                        aria-invalid={!!errors.dueDate}
                        onChange={(e) => setField("dueDate", e.target.value)}
                      />
                      <FieldError>{errors.dueDate}</FieldError>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Item</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldSet>
                  <FieldLegend variant="label" className="sr-only">
                    Line item
                  </FieldLegend>
                  <FieldGroup>
                    <Field data-invalid={!!errors.itemName || undefined}>
                      <FieldLabel htmlFor="itemName">Item name</FieldLabel>
                      <Input
                        id="itemName"
                        value={form.itemName}
                        aria-invalid={!!errors.itemName}
                        onChange={(e) => setField("itemName", e.target.value)}
                      />
                      <FieldError>{errors.itemName}</FieldError>
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.itemQuantity || undefined}>
                        <FieldLabel htmlFor="itemQuantity">Quantity</FieldLabel>
                        <Input
                          id="itemQuantity"
                          type="number"
                          min={1}
                          step={1}
                          value={form.itemQuantity}
                          aria-invalid={!!errors.itemQuantity}
                          onChange={(e) => setField("itemQuantity", e.target.value)}
                        />
                        <FieldError>{errors.itemQuantity}</FieldError>
                      </Field>

                      <Field data-invalid={!!errors.itemRate || undefined}>
                        <FieldLabel htmlFor="itemRate">Rate</FieldLabel>
                        <Input
                          id="itemRate"
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.itemRate}
                          aria-invalid={!!errors.itemRate}
                          onChange={(e) => setField("itemRate", e.target.value)}
                        />
                        <FieldError>{errors.itemRate}</FieldError>
                      </Field>
                    </div>

                    <FieldSeparator />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.taxPercent || undefined}>
                        <FieldLabel htmlFor="taxPercent">Tax (%)</FieldLabel>
                        <Input
                          id="taxPercent"
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.taxPercent}
                          aria-invalid={!!errors.taxPercent}
                          onChange={(e) => setField("taxPercent", e.target.value)}
                        />
                        <FieldError>{errors.taxPercent}</FieldError>
                      </Field>

                      <Field data-invalid={!!errors.discount || undefined}>
                        <FieldLabel htmlFor="discount">Discount</FieldLabel>
                        <Input
                          id="discount"
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.discount}
                          aria-invalid={!!errors.discount}
                          onChange={(e) => setField("discount", e.target.value)}
                        />
                        <FieldDescription>Optional, defaults to 0.</FieldDescription>
                        <FieldError>{errors.discount}</FieldError>
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(preview.subTotal, currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatCurrency(preview.taxAmount, currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">-{formatCurrency(Number(form.discount) || 0, currencySymbol)}</span>
                </div>
                <div className="my-1 border-t border-border" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(preview.totalAmount, currencySymbol)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  This preview is calculated in the browser for display only — the real total is always computed
                  server-side.
                </p>

                <Button type="submit" className="mt-3 w-full" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
                  Save invoice
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link to="/invoices">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
