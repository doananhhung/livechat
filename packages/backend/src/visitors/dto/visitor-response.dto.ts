import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Visitor as SharedVisitorType } from '@live-chat/shared-types';

export class VisitorResponseDto implements SharedVisitorType {
  @ApiProperty({ description: 'The unique identifier of the visitor' })
  id: number;

  @ApiProperty({ description: 'The project ID the visitor belongs to' })
  projectId: number;

  @ApiProperty({ description: 'The unique identifier (UID) of the visitor' })
  visitorUid: string;

  @ApiPropertyOptional({ description: 'The display name of the visitor', nullable: true })
  displayName?: string | null;

  @ApiPropertyOptional({ description: 'The email of the visitor', nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ description: 'The phone number of the visitor', nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Custom data associated with the visitor', type: 'object', nullable: true, additionalProperties: true })
  customData?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'The current URL the visitor is on', nullable: true })
  currentUrl?: string | null;

  @ApiPropertyOptional({ description: 'The timestamp of the last time the visitor was seen', type: 'string', format: 'date-time', nullable: true })
  lastSeenAt?: Date;

  @ApiProperty({ description: 'The creation timestamp of the visitor', type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'The last update timestamp of the visitor', type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Indicates if the visitor is currently online (runtime-only)', nullable: true })
  isOnline?: boolean | null;
}
