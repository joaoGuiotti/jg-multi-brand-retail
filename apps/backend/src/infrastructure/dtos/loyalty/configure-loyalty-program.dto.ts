import { IsNumber, IsInt, Min, Max, IsPositive, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigureLoyaltyProgramDto {
  @ApiProperty({
    description: 'Fator de pontos obtidos por cada 1 Real líquido gasto',
    example: 1.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  pointsPerReal: number;

  @ApiProperty({
    description: 'Valor monetário em Reais de desconto equivalente a 1 Ponto',
    example: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Min(0.0001)
  redeemRatio: number;

  @ApiProperty({
    description:
      'Mínimo de pontos acumulados exigido para o cliente poder resgatar no PDV',
    example: 100,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  minRedeemPoints: number;

  @ApiProperty({
    description:
      'Porcentagem limite máxima de desconto por fidelidade sobre a venda',
    example: 50.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.1)
  @Max(100.0)
  maxDiscountPct: number;

  @ApiProperty({
    description: 'Indica se o programa de fidelidade está ativo',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}
