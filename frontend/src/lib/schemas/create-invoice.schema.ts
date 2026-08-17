import { z } from "zod";

export const createInvoiceSchema = z
  .object({
    customerFullname: z.string().min(1, "Customer name is required."),
    customerEmail: z.string().min(1, "Customer email is required.").email("Enter a valid email address."),
    customerMobile: z.string().optional(),
    customerAddress: z.string().optional(),
    invoiceNumber: z.string().min(1, "Invoice number is required."),
    invoiceDate: z.string().min(1, "Enter a valid invoice date."),
    dueDate: z.string().min(1, "Enter a valid due date."),
    currency: z.string().min(1, "Currency is required."),
    itemName: z.string().min(1, "Item name is required."),
    itemQuantity: z.coerce
      .number({ invalid_type_error: "Quantity must be a positive integer." })
      .int("Quantity must be a positive integer.")
      .positive("Quantity must be a positive integer."),
    itemRate: z.coerce
      .number({ invalid_type_error: "Rate must be a positive number." })
      .positive("Rate must be a positive number."),
    taxPercent: z.coerce
      .number({ invalid_type_error: "Tax must be zero or a positive number." })
      .min(0, "Tax must be zero or a positive number."),
    discount: z.coerce
      .number({ invalid_type_error: "Discount must be zero or a positive number." })
      .min(0, "Discount must be zero or a positive number."),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.invoiceDate), {
    message: "Due date must be on or after the invoice date.",
    path: ["dueDate"],
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
