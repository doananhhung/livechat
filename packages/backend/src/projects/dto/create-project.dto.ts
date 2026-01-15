import { IsString, Length, IsArray, ArrayMinSize, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @IsString()
  @Length(1, 100, { message: 'Project name must be between 1 and 100 characters long.' })
  @ApiProperty({ description: 'The name of the new project', minLength: 1, maxLength: 100 })
  name: string;

  @ApiProperty({ example: ["example.com", "another.com"], description: "List of whitelisted domains (FQDNs only, no protocol)" })
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d{1,5})?$/, {
    each: true,
    message: "Domains must be valid hostnames (e.g., example.com) or localhost, optionally with a port (e.g., localhost:3000). Protocols (http://) are not allowed."
  })
  whitelistedDomains: string[];
}
