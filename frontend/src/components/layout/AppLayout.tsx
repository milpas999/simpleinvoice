import { FileTextIcon, LogOutIcon, PlusIcon } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function initialsFor(fullname: string): string {
  const parts = fullname.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "U";
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <NavLink to="/invoices" className="flex items-center gap-2 font-semibold tracking-tight">
              <FileTextIcon data-icon="inline-start" className="text-primary" />
              SimpleInvoice
            </NavLink>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink
                to="/invoices"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "bg-muted text-foreground"
                  )
                }
                end
              >
                Invoices
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/invoices/new")}>
              <PlusIcon data-icon="inline-start" />
              New Invoice
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <Avatar>
                    <AvatarFallback>{initialsFor(user?.fullname ?? "User")}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="font-medium">{user?.fullname}</span>
                  <span className="font-normal text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                  <LogOutIcon data-icon="inline-start" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
