export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export class LoginValidationError extends Error {
  fieldErrors: LoginFieldErrors;
  constructor(fieldErrors: LoginFieldErrors) {
    super("Validation failed");
    this.fieldErrors = fieldErrors;
  }
}
