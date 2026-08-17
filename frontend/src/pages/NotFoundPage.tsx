import { CompassIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <CompassIcon className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
      <Button asChild>
        <Link to="/invoices">Back to invoices</Link>
      </Button>
    </div>
  );
}
