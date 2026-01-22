import {
  IsString,
  IsOptional,
  IsArray,
  Matches,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { WidgetSettingsDto } from "./widget-settings.dto";

export class UpdateProjectDto {
  @ApiProperty({
    example: "My Renamed Project",
    description: "New name for the project",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: { primaryColor: "#007bff", showAgentAvatar: true },
    description: "Updated widget settings",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetSettingsDto)
  widgetSettings?: WidgetSettingsDto;

  @ApiProperty({
    example: ["newdomain.com", "anothernew.com"],
    description: "Updated list of whitelisted domains (FQDNs only, no protocol)",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d{1,5})?$/, {
    each: true,
    message: "Domains must be valid hostnames (e.g., example.com) or localhost, optionally with a port (e.g., localhost:3000). Protocols (http://) are not allowed."
  })
  whitelistedDomains?: string[];

  @ApiProperty({
    example: 10,
    description: "Minutes after which an agent-replied conversation automatically moves to PENDING. 0 or null to disable.",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  autoResolveMinutes?: number | null;

  @ApiProperty({
    example: true,
    description: "Enable AI auto-responder for this project when agents are offline.",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  aiResponderEnabled?: boolean;

  @ApiProperty({
    example: "You are a helpful assistant.",
    description: "System prompt for the AI responder.",
    required: false,
  })
  @IsOptional()
  @IsString()
  aiResponderPrompt?: string;
}