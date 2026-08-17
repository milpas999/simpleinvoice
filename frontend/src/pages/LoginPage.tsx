import { AlertCircleIcon, FileTextIcon, LoaderCircleIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { LoginValidationError, type LoginFieldErrors } from "@/lib/auth-errors";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/invoices";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/invoices", { replace: true });
    } catch (error) {
      if (error instanceof LoginValidationError) {
        setFieldErrors(error.fieldErrors);
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileTextIcon />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">SimpleInvoice</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{formError}</AlertTitle>
                  </Alert>
                )}

                <Field data-invalid={!!fieldErrors.email || undefined}>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={!!fieldErrors.email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <FieldError>{fieldErrors.email}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.password || undefined}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    aria-invalid={!!fieldErrors.password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <FieldError>{fieldErrors.password}</FieldError>
                </Field>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
                  Sign in
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          UI preview build — no backend is connected. Any valid-looking email and password will sign you in.
        </p>
      </div>
    </div>
  );
}
