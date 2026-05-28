import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty({
    description: 'ID único do cliente portador dos pontos',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Número de pontos a serem debitados',
    example: 200,
    type: Number,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  pointsToRedeem: number;

  @ApiProperty({
    description:
      'ID da venda no PDV onde o desconto de cashback está sendo aplicado',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  saleId: string;
}
