import { Badge } from "@/components/ui/badge";
import type { DisplayStatus } from "@/types/invoice";

const VARIANT_BY_STATUS: Record<DisplayStatus, "outline" | "secondary" | "default" | "destructive"> = {
  Draft: "outline",
  Pending: "secondary",
  Paid: "default",
  Overdue: "destructive",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{status}</Badge>;
}
