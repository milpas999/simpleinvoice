import { AlertCircleIcon, ChevronDownIcon, ChevronUpIcon, FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceFilters, type InvoiceFiltersState } from "@/components/invoices/InvoiceFilters";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { getPageItems } from "@/lib/pagination";
import { fetchInvoicesThunk, selectInvoiceList } from "@/store/invoicesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { SortField, SortOrder } from "@/types/invoice";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface SortableColumnHeaderProps {
  label: string;
  field: SortField;
  align?: "right";
  sortBy: SortField;
  ordering: SortOrder;
  onSort: (field: SortField, ordering: SortOrder) => void;
}

function SortableColumnHeader({ label, field, align, sortBy, ordering, onSort }: SortableColumnHeaderProps) {
  const isActive = sortBy === field;

  return (
    <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
      <span>{label}</span>
      <span className="flex flex-col">
        <button
          type="button"
          aria-label={`Sort ${label} ascending`}
          aria-pressed={isActive && ordering === "ASC"}
          onClick={() => onSort(field, "ASC")}
          className={`leading-none transition-colors ${
            isActive && ordering === "ASC" ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
        >
          <ChevronUpIcon className="size-3" />
        </button>
        <button
          type="button"
          aria-label={`Sort ${label} descending`}
          aria-pressed={isActive && ordering === "DESC"}
          onClick={() => onSort(field, "DESC")}
          className={`-mt-1 leading-none transition-colors ${
            isActive && ordering === "DESC" ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
        >
          <ChevronDownIcon className="size-3" />
        </button>
      </span>
    </div>
  );
}

export function InvoiceListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, paging, status, error } = useAppSelector(selectInvoiceList);

  const [filters, setFilters] = useState<InvoiceFiltersState>({
    keyword: "",
    status: "All",
  });
  const [sortBy, setSortBy] = useState<SortField>("invoiceDate");
  const [ordering, setOrdering] = useState<SortOrder>("DESC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    void dispatch(
      fetchInvoicesThunk({
        page,
        pageSize,
        sortBy,
        ordering,
        status: filters.status,
        keyword: filters.keyword,
      }),
    );
  }, [dispatch, page, pageSize, sortBy, ordering, filters]);

  function updateFilters(next: InvoiceFiltersState) {
    setFilters(next);
    setPage(1);
  }

  function updateSort(field: SortField, nextOrdering: SortOrder) {
    setSortBy(field);
    setOrdering(nextOrdering);
    setPage(1);
  }

  function updatePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(paging.total / paging.pageSize));
  const pageItems = getPageItems(page, totalPages);
  const rangeStart = paging.total === 0 ? 0 : (paging.page - 1) * paging.pageSize + 1;
  const rangeEnd = Math.min(paging.page * paging.pageSize, paging.total);
  const isInitialLoad = status === "loading" && data.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">View, search, and manage all invoices.</p>
      </div>

      <InvoiceFilters value={filters} onChange={updateFilters} />

      {status === "failed" && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{error ?? "Failed to load invoices."}</AlertTitle>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>
                <SortableColumnHeader
                  label="Invoice date"
                  field="invoiceDate"
                  sortBy={sortBy}
                  ordering={ordering}
                  onSort={updateSort}
                />
              </TableHead>
              <TableHead>
                <SortableColumnHeader
                  label="Due date"
                  field="dueDate"
                  sortBy={sortBy}
                  ordering={ordering}
                  onSort={updateSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableColumnHeader
                  label="Total amount"
                  field="totalAmount"
                  align="right"
                  sortBy={sortBy}
                  ordering={ordering}
                  onSort={updateSort}
                />
              </TableHead>
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
                  <StatusBadge status={invoice.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {isInitialLoad && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading invoices…
          </div>
        )}

        {!isInitialLoad && data.length === 0 && (
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
