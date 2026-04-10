import { ApiProperty } from '@nestjs/swagger';

export class OperationalEventDto {
  @ApiProperty()
  event: string;

  @ApiProperty()
  payload: any;

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  tenantId: string;
}
