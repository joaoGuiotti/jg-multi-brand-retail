import { ApiProperty } from '@nestjs/swagger';

/**
 * Schemas de resposta comuns para documentação Swagger.
 * Use com @ApiResponse({ type: ErrorResponseDto }) para padronizar erros.
 */

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Código HTTP do erro' })
  statusCode: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Mensagem descritiva do erro',
  })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: 'Tipo do erro HTTP' })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({
    example: ['pointsPerReal must be a positive number'],
    description: 'Lista de mensagens de validação',
    type: [String],
  })
  message: string[];

  @ApiProperty({ example: 'Unprocessable Entity' })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'Acesso negado para o perfil atual' })
  message: string;

  @ApiProperty({ example: 'Forbidden' })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Recurso não encontrado' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

/** Shorthand decorators para compor nas respostas */
export const ApiCommonResponses = {
  unauthorized: {
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  },
  forbidden: {
    status: 403,
    description: 'Perfil sem permissão para este recurso',
    type: ForbiddenResponseDto,
  },
  notFound: {
    status: 404,
    description: 'Recurso não encontrado',
    type: NotFoundResponseDto,
  },
  validation: {
    status: 422,
    description: 'Erro de validação dos dados enviados',
    type: ValidationErrorResponseDto,
  },
} as const;
