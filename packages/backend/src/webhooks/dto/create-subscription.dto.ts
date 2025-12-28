import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['https'] })
  url: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  eventTriggers: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
