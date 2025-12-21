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
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import type { IWidgetSettingsDto } from "@live-chat/shared-types";
import { WidgetPosition, WidgetTheme } from "@live-chat/shared-types";

export class WidgetSettingsDto implements IWidgetSettingsDto {
  @ApiProperty({
    example: WidgetTheme.LIGHT,
    enum: WidgetTheme,
    description: "Theme of the chat widget",
    required: false,
  })
  @IsOptional()
  @IsEnum(WidgetTheme, { message: "Invalid widget theme." })
  theme?: WidgetTheme;

  @ApiProperty({
    example: "https://example.com/background.jpg",
    description: "URL for the widget's background image",
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: "Background image must be a valid URL." })
  backgroundImageUrl?: string;

  @ApiProperty({
    example: 0.7,
    description: "Opacity of the background image (0 to 1)",
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Background opacity must be a number." })
  @Min(0)
  @Max(1)
  backgroundOpacity?: number;

  @ApiProperty({
    example: "Welcome to our support!",
    description: "Text displayed in the widget header",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Header text must be a string." })
  @MaxLength(50)
  headerText?: string;

  @ApiProperty({
    example: "#4CAF50",
    description: "Primary color of the widget in hex format",
    required: false,
  })
  @IsOptional()
  @IsHexColor({ message: "Primary color must be a valid hex color code." })
  primaryColor?: string;

  @ApiProperty({
    example: WidgetPosition.BOTTOM_RIGHT,
    enum: WidgetPosition,
    description: "Position of the widget on the screen",
    required: false,
  })
  @IsOptional()
  @IsEnum(WidgetPosition, { message: "Invalid widget position." })
  position?: WidgetPosition;

  @ApiProperty({
    example: "Arial, sans-serif",
    description: "Font family for the widget text",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Font family must be a valid string." })
  fontFamily?: string;

  @ApiProperty({
    example: "https://example.com/company-logo.png",
    description: "URL for the company logo displayed in the widget",
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: "Company logo must be a valid URL." })
  companyLogoUrl?: string;

  @ApiProperty({
    example: "How can we help you today?",
    description: "Welcome message displayed to visitors",
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "Welcome message cannot be longer than 200 characters.",
  })
  welcomeMessage?: string;

  @ApiProperty({
    example: "Support Team",
    description: "Display name for agents in the chat",
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentDisplayName?: string;

  @ApiProperty({
    example: "We are currently offline, please leave a message.",
    description: "Message displayed when agents are offline",
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  offlineMessage?: string;

  @ApiProperty({
    example: 5000,
    description: "Delay in milliseconds before the widget automatically opens",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Auto open delay must be a number." })
  @Min(0)
  autoOpenDelay?: number;
}
