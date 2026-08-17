import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isOnOrAfter', async: false })
export class IsOnOrAfterConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [relatedProperty] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, string>)[
      relatedProperty
    ];
    if (!value || !relatedValue) {
      return true;
    }
    return new Date(value) >= new Date(relatedValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty] = args.constraints as [string];
    return `${args.property} must be on or after ${relatedProperty}`;
  }
}

export function IsOnOrAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsOnOrAfterConstraint,
    });
  };
}
