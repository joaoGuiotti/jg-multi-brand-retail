import { ApiProperty } from '@nestjs/swagger';

export class PublicTenantTheme {
  @ApiProperty()
  primaryColor: string;

  @ApiProperty()
  accentColor: string;
}

export class PublicTenantOutput {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  logoUrl: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: () => PublicTenantTheme })
  theme: PublicTenantTheme;
}
