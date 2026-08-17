import { ArrowDownIcon, ArrowUpIcon, SearchIcon, XIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { FILTERABLE_STATUSES, type DisplayStatus, type SortField, type SortOrder } from "@/types/invoice";

const SORT_FIELD_LABELS: Record<SortField, string> = {
  invoiceDate: "Invoice date",
  dueDate: "Due date",
  totalAmount: "Total amount",
};

export interface InvoiceFiltersState {
  keyword: string;
  status: DisplayStatus | "All";
  sortBy: SortField;
  ordering: SortOrder;
}

interface InvoiceFiltersProps {
  value: InvoiceFiltersState;
  onChange: (value: InvoiceFiltersState) => void;
}

export function InvoiceFilters({ value, onChange }: InvoiceFiltersProps) {
  const hasActiveFilters = value.keyword.trim().length > 0 || value.status !== "All";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search invoice # or customer"
          value={value.keyword}
          onChange={(event) => onChange({ ...value, keyword: event.target.value })}
          aria-label="Search invoices"
        />
      </InputGroup>

      <Select
        value={value.status}
        onValueChange={(status) => onChange({ ...value, status: status as DisplayStatus | "All" })}
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All statuses</SelectItem>
          {FILTERABLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.sortBy} onValueChange={(sortBy) => onChange({ ...value, sortBy: sortBy as SortField })}>
        <SelectTrigger aria-label="Sort by">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_FIELD_LABELS) as SortField[]).map((field) => (
            <SelectItem key={field} value={field}>
              {SORT_FIELD_LABELS[field]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={value.ordering}
        onValueChange={(ordering) => ordering && onChange({ ...value, ordering: ordering as SortOrder })}
        aria-label="Sort direction"
        variant="outline"
      >
        <ToggleGroupItem value="ASC" aria-label="Ascending">
          <ArrowUpIcon data-icon="inline-start" />
          Asc
        </ToggleGroupItem>
        <ToggleGroupItem value="DESC" aria-label="Descending">
          <ArrowDownIcon data-icon="inline-start" />
          Desc
        </ToggleGroupItem>
      </ToggleGroup>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...value, keyword: "", status: "All" })}
        >
          <XIcon data-icon="inline-start" />
          Clear
        </Button>
      )}
    </div>
  );
}
