
import {
  IsString,
  IsOptional,
  IsArray,
  IsFQDN,
  ArrayMinSize,
  ValidateNested,
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
  @IsFQDN({}, { each: true, message: "Domains must be valid hostnames (e.g., example.com) without protocols (http://)." })
  whitelistedDomains?: string[];
}
