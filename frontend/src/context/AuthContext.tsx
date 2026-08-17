import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "@/context/auth-context";
import { LoginValidationError, type LoginFieldErrors } from "@/lib/auth-errors";
import type { User } from "@/types/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function deriveFullname(email: string): string {
  const local = email.split("@")[0] ?? "User";
  return (
    local
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "User"
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const fieldErrors: LoginFieldErrors = {};

    if (!email.trim()) {
      fieldErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      fieldErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      fieldErrors.password = "Password is required.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new LoginValidationError(fieldErrors);
    }

    // No backend is wired up: any well-formed credentials succeed.
    await new Promise((resolve) => setTimeout(resolve, 400));

    setUser({
      id: "ad1e0902-1928-4345-b513-60c86c94fc91",
      email: email.trim(),
      fullname: deriveFullname(email.trim()),
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
