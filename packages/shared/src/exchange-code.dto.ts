import { ApiProperty } from "@nestjs/swagger";

export class ExchangeCodeDto {
  @ApiProperty({ example: "some-one-time-code", description: "One-time code received from OAuth provider callback" })
  code: string;
}
