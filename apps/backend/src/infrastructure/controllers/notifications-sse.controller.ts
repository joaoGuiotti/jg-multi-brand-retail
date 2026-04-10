import { Controller, Get, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../decorators/authenticated-user.interface';
import { OperationalStreamService } from '../services/operational-stream.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationsSseController {
  constructor(private readonly sseService: OperationalStreamService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Operational Event Stream', 
    description: 'Server-Sent Events stream for real-time operational monitoring.' 
  })
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.sseService.getStream(user.tenantId);
  }
}
