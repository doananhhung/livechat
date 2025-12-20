import {
  IsString,
  IsHexColor,
  IsOptional,
  MaxLength,
  IsEnum,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum WidgetPosition {
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
}

export enum WidgetTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export class WidgetSettingsDto {
  @IsOptional()
  @IsEnum(WidgetTheme, { message: 'Invalid widget theme.' })
  theme?: WidgetTheme;

  @IsOptional()
  @IsUrl({}, { message: 'Background image must be a valid URL.' })
  backgroundImageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Background opacity must be a number.' })
  @Min(0)
  @Max(1)
  backgroundOpacity?: number;

  @IsOptional()
  @IsString({ message: 'Header text must be a string.' })
  @MaxLength(50)
  headerText?: string;

  @IsOptional()
  @IsHexColor({ message: 'Primary color must be a valid hex color code.' })
  primaryColor?: string;

  @IsOptional()
  @IsEnum(WidgetPosition, { message: 'Invalid widget position.' })
  position?: WidgetPosition;

  @IsOptional()
  @IsString({ message: 'Font family must be a valid string.' })
  fontFamily?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Company logo must be a valid URL.' })
  companyLogoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Welcome message cannot be longer than 200 characters.',
  })
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentDisplayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  offlineMessage?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Auto open delay must be a number.' })
  @Min(0)
  autoOpenDelay?: number;
}
