import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, FileTextIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login.schema";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/invoices";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate("/invoices", { replace: true });
    } catch {
      setFormError("Invalid email or password.");
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
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FieldGroup>
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{formError}</AlertTitle>
                  </Alert>
                )}

                <Field data-invalid={!!errors.email || undefined}>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.password || undefined}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FieldError>{errors.password?.message}</FieldError>
                </Field>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
                  Sign in
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
