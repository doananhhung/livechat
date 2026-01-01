import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

/**
 * Custom URL validator that allows HTTP in test environment for local test servers.
 * In production, only HTTPS is allowed.
 */
@ValidatorConstraint({ name: 'webhookUrl', async: false })
class WebhookUrlValidator implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments): boolean {
    try {
      const parsed = new URL(url);
      
      // Test environment: allow http for localhost/127.0.0.1
      if (process.env.NODE_ENV === 'test') {
        const isLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        if (isLoopback && parsed.protocol === 'http:') {
          return true;
        }
      }
      
      // Production: only HTTPS allowed
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'url must be a valid HTTPS URL';
  }
}

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @Validate(WebhookUrlValidator)
  url: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  eventTriggers: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

