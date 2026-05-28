import { IsUUID, IsInt, IsString, MinLength, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustPointsManualDto {
  @ApiProperty({
    description: 'ID único do cliente cujos pontos serão ajustados',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description:
      'Pontos movimentados (positivo para crédito administrativo, negativo para débito). Não pode ser zero.',
    example: 100,
    type: Number,
  })
  @IsInt()
  @NotEquals(0, {
    message: 'O valor de ajuste de pontos não pode ser igual a zero',
  })
  points: number;

  @ApiProperty({
    description:
      'Justificativa obrigatória da operação administrativa para fins de auditoria (mínimo 10 caracteres)',
    example: 'Cliente esqueceu de se identificar na compra anterior',
    type: String,
    minLength: 10,
  })
  @IsString()
  @MinLength(10, {
    message:
      'A justificativa de auditoria deve conter pelo menos 10 caracteres',
  })
  reason: string;
}
