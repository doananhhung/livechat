import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsUrl,
  ArrayMinSize,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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
  @IsObject()
  widgetSettings?: object;

  @ApiProperty({
    example: ["newdomain.com", "anothernew.com"],
    description: "Updated list of whitelisted domains",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  whitelistedDomains?: string[];
}
