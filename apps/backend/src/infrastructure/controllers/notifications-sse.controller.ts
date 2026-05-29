import { Controller, Get, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../decorators/authenticated-user.interface';
import { OperationalStreamService } from '../services/operational-stream.service';
import { UnauthorizedResponseDto } from '../dtos/common/api-responses.dto';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@Controller('api/v1/notifications')
export class NotificationsSseController {
  constructor(private readonly sseService: OperationalStreamService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Stream de eventos em tempo real (SSE)',
    description:
      'Abre uma conexão **Server-Sent Events (SSE)** persistente para receber notificações operacionais do Tenant em tempo real.\n\n' +
      '**Como usar:**\n' +
      '```javascript\n' +
      "const source = new EventSource('/api/v1/notifications/stream', {\n" +
      "  headers: { Authorization: 'Bearer <token>' }\n" +
      '});\n' +
      'source.onmessage = (event) => console.log(JSON.parse(event.data));\n' +
      '```\n\n' +
      '> ⚠️ O Swagger UI não suporta visualizar streams SSE. Use o código acima no frontend ou ferramentas como `curl -N`.',
    operationId: 'notifications_stream',
  })
  @ApiResponse({
    status: 200,
    description: 'Stream SSE aberto com sucesso. Mantém conexão ativa.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'data: {"type":"SALE_COMPLETED","payload":{"saleId":"uuid"}}\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.sseService.getStream(user.tenantId);
  }
}
