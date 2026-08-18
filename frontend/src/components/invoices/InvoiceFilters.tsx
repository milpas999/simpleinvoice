import { SearchIcon, XIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FILTERABLE_STATUSES, type DisplayStatus } from "@/types/invoice";

export interface InvoiceFiltersState {
  keyword: string;
  status: DisplayStatus | "All";
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
