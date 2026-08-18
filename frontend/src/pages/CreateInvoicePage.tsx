import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { formatCurrency } from "@/lib/calculations";
import { createInvoiceSchema, type CreateInvoiceFormValues } from "@/lib/schemas/create-invoice.schema";
import { calculateTotalsThunk, createInvoiceThunk, resetPreviewTotals, selectPreviewTotals } from "@/store/invoicesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ApiErrorBody } from "@/types/api";
import { firstErrorMessage } from "@/types/api";
import type { CreateInvoicePayload } from "@/types/invoice";

const PREVIEW_DEBOUNCE_MS = 400;

const CURRENCIES = [
  { currency: "AUD", currencySymbol: "AU$" },
  { currency: "USD", currencySymbol: "$" },
  { currency: "GBP", currencySymbol: "£" },
  { currency: "SGD", currencySymbol: "S$" },
  { currency: "EUR", currencySymbol: "€" },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerFullname: "",
      customerEmail: "",
      customerMobile: "",
      customerAddress: "",
      invoiceNumber: "",
      invoiceDate: todayStr(),
      dueDate: "",
      currency: "AUD",
      itemName: "",
      itemQuantity: 1,
      itemRate: 0,
      taxPercent: 10,
      discount: 0,
    },
  });

  const [itemQuantity, itemRate, taxPercent, discount, currency] = useWatch({
    control,
    name: ["itemQuantity", "itemRate", "taxPercent", "discount", "currency"],
  });

  const preview = useAppSelector(selectPreviewTotals);

  useEffect(() => {
    dispatch(resetPreviewTotals());
    return () => {
      dispatch(resetPreviewTotals());
    };
  }, [dispatch]);

  useEffect(() => {
    const quantity = Number(itemQuantity);
    const rate = Number(itemRate);
    const tax = Number(taxPercent);
    const discountValue = Number(discount);
    const isCalculable =
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(rate) &&
      rate > 0 &&
      Number.isFinite(tax) &&
      tax >= 0 &&
      Number.isFinite(discountValue) &&
      discountValue >= 0;

    if (!isCalculable) {
      dispatch(resetPreviewTotals());
      return;
    }

    const timeoutId = setTimeout(() => {
      void dispatch(
        calculateTotalsThunk({ quantity, rate, taxPercent: tax, discount: discountValue }),
      );
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [itemQuantity, itemRate, taxPercent, discount, dispatch]);

  const currencySymbol = CURRENCIES.find((c) => c.currency === currency)?.currencySymbol ?? "";

  async function onSubmit(values: CreateInvoiceFormValues) {
    const selectedCurrency = CURRENCIES.find((c) => c.currency === values.currency) ?? CURRENCIES[0];

    const payload: CreateInvoicePayload = {
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      currency: selectedCurrency.currency,
      currencySymbol: selectedCurrency.currencySymbol,
      customer: {
        fullname: values.customerFullname.trim(),
        email: values.customerEmail.trim(),
        mobileNumber: values.customerMobile?.trim() || undefined,
        address: values.customerAddress?.trim() || undefined,
      },
      item: {
        name: values.itemName.trim(),
        quantity: values.itemQuantity,
        rate: values.itemRate,
      },
      taxPercent: values.taxPercent,
      discount: values.discount,
    };

    try {
      const created = await dispatch(createInvoiceThunk(payload)).unwrap();
      toast.success("Invoice created", {
        description: `${created.invoiceNumber} was saved as a draft.`,
      });
      navigate("/invoices");
    } catch (error) {
      const body = error as ApiErrorBody | undefined;
      if (body?.statusCode === 409) {
        setError("invoiceNumber", { message: firstErrorMessage(body, "This invoice number already exists.") });
      } else {
        toast.error(firstErrorMessage(body, "Something went wrong while creating the invoice."));
      }
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                      aria-invalid={!!errors.customerFullname}
                      {...register("customerFullname")}
                    />
                    <FieldError>{errors.customerFullname?.message}</FieldError>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.customerEmail || undefined}>
                      <FieldLabel htmlFor="customerEmail">Customer email</FieldLabel>
                      <Input
                        id="customerEmail"
                        type="email"
                        aria-invalid={!!errors.customerEmail}
                        {...register("customerEmail")}
                      />
                      <FieldError>{errors.customerEmail?.message}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="customerMobile">Customer mobile</FieldLabel>
                      <Input id="customerMobile" type="tel" {...register("customerMobile")} />
                      <FieldDescription>Optional.</FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="customerAddress">Customer address</FieldLabel>
                    <Input id="customerAddress" {...register("customerAddress")} />
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
                        aria-invalid={!!errors.invoiceNumber}
                        {...register("invoiceNumber")}
                      />
                      <FieldError>{errors.invoiceNumber?.message}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.currency || undefined}>
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <Controller
                        control={control}
                        name="currency"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
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
                        )}
                      />
                      <FieldError>{errors.currency?.message}</FieldError>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.invoiceDate || undefined}>
                      <FieldLabel htmlFor="invoiceDate">Invoice date</FieldLabel>
                      <Input
                        id="invoiceDate"
                        type="date"
                        aria-invalid={!!errors.invoiceDate}
                        {...register("invoiceDate")}
                      />
                      <FieldError>{errors.invoiceDate?.message}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.dueDate || undefined}>
                      <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
                      <Input id="dueDate" type="date" aria-invalid={!!errors.dueDate} {...register("dueDate")} />
                      <FieldError>{errors.dueDate?.message}</FieldError>
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
                      <Input id="itemName" aria-invalid={!!errors.itemName} {...register("itemName")} />
                      <FieldError>{errors.itemName?.message}</FieldError>
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.itemQuantity || undefined}>
                        <FieldLabel htmlFor="itemQuantity">Quantity</FieldLabel>
                        <Input
                          id="itemQuantity"
                          type="number"
                          min={1}
                          step={1}
                          aria-invalid={!!errors.itemQuantity}
                          {...register("itemQuantity")}
                        />
                        <FieldError>{errors.itemQuantity?.message}</FieldError>
                      </Field>

                      <Field data-invalid={!!errors.itemRate || undefined}>
                        <FieldLabel htmlFor="itemRate">Rate</FieldLabel>
                        <Input
                          id="itemRate"
                          type="number"
                          min={0}
                          step="0.01"
                          aria-invalid={!!errors.itemRate}
                          {...register("itemRate")}
                        />
                        <FieldError>{errors.itemRate?.message}</FieldError>
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
                          aria-invalid={!!errors.taxPercent}
                          {...register("taxPercent")}
                        />
                        <FieldError>{errors.taxPercent?.message}</FieldError>
                      </Field>

                      <Field data-invalid={!!errors.discount || undefined}>
                        <FieldLabel htmlFor="discount">Discount</FieldLabel>
                        <Input
                          id="discount"
                          type="number"
                          min={0}
                          step="0.01"
                          aria-invalid={!!errors.discount}
                          {...register("discount")}
                        />
                        <FieldDescription>Optional, defaults to 0.</FieldDescription>
                        <FieldError>{errors.discount?.message}</FieldError>
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
                  <span className="tabular-nums">{formatCurrency(preview.totals.subTotal, currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatCurrency(preview.totals.taxAmount, currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">-{formatCurrency(Number(discount) || 0, currencySymbol)}</span>
                </div>
                <div className="my-1 border-t border-border" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(preview.totals.totalAmount, currencySymbol)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {preview.status === "loading" ? "Calculating…" : "Calculated server-side."}
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
