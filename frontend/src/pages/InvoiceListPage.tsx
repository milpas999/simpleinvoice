import { FileTextIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceFilters, type InvoiceFiltersState } from "@/components/invoices/InvoiceFilters";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/use-invoices";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { queryInvoices } from "@/lib/invoice-query";
import { getPageItems } from "@/lib/pagination";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function InvoiceListPage() {
  const { invoices } = useInvoices();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<InvoiceFiltersState>({
    keyword: "",
    status: "All",
    sortBy: "invoiceDate",
    ordering: "DESC",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function updateFilters(next: InvoiceFiltersState) {
    setFilters(next);
    setPage(1);
  }

  function updatePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  const { data, paging } = useMemo(
    () =>
      queryInvoices(invoices, {
        page,
        pageSize,
        sortBy: filters.sortBy,
        ordering: filters.ordering,
        status: filters.status,
        keyword: filters.keyword,
      }),
    [invoices, page, pageSize, filters]
  );

  const totalPages = Math.max(1, Math.ceil(paging.total / paging.pageSize));
  const pageItems = getPageItems(page, totalPages);
  const rangeStart = paging.total === 0 ? 0 : (paging.page - 1) * paging.pageSize + 1;
  const rangeEnd = Math.min(paging.page * paging.pageSize, paging.total);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">View, search, and manage all invoices.</p>
      </div>

      <InvoiceFilters value={filters} onChange={updateFilters} />

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice date</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Total amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invoice) => (
              <TableRow
                key={invoice.invoiceId}
                className="cursor-pointer"
                onClick={() => navigate(`/invoices/${invoice.invoiceId}`)}
              >
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customer.fullname}</TableCell>
                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(invoice.totalAmount, invoice.currencySymbol)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.displayStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.length === 0 && (
          <Empty className="border-0 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>No invoices found</EmptyTitle>
              <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {paging.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {rangeStart}–{rangeEnd} of {paging.total}
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => updatePageSize(Number(v))}>
              <SelectTrigger size="sm" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page === 1}
                  className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>

              {pageItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
