import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Headers,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../decorators/authenticated-user.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUserNotificationsUseCase } from '../../application/use-cases/notifications/get-user-notifications.use-case';
import { MarkAsReadUseCase } from '../../application/use-cases/notifications/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '../../application/use-cases/notifications/mark-all-as-read.use-case';
import { GetUserPreferencesUseCase } from '../../application/use-cases/notifications/get-user-preferences.use-case';
import { UpdatePreferenceUseCase } from '../../application/use-cases/notifications/update-preference.use-case';
import { NotificationFiltersDto } from '../dtos/notifications/notification-filters.dto';
import { UpdatePreferenceDto } from '../dtos/notifications/update-preference.dto';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../domain/repositories/notifications/notifications.repository.interface';
import { CreateNotificationUseCase } from '../../application/use-cases/notifications/create-notification.use-case';
import { CreateNotificationDto } from '../dtos/notifications/create-notification.dto';
import { NotificationCollectionPresenter } from '../presenters/notification.presenter';
import {
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
    private readonly updatePreferenceUseCase: UpdatePreferenceUseCase,
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar notificações do usuário',
    description:
      'Retorna a lista paginada de notificações do usuário autenticado com suporte a filtros por status de leitura e tipo.',
    operationId: 'notifications_findAll',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    description: 'Se `true`, retorna apenas as notificações não lidas',
    type: Boolean,
    example: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 20)',
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: NotificationFiltersDto,
  ) {
    const output = await this.getUserNotificationsUseCase.execute(
      user.tenantId,
      user.id,
      filters,
    );
    return new NotificationCollectionPresenter(output);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obter preferências de notificação',
    description:
      'Retorna as preferências de notificação do usuário: quais tipos de eventos geram notificações e por quais canais (in-app, e-mail, etc.).',
    operationId: 'notifications_getPreferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferências de notificação retornadas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.getUserPreferencesUseCase.execute(user.tenantId, user.id);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Atualizar preferências de notificação',
    description:
      'Atualiza as preferências de notificação do usuário para um tipo específico de evento.',
    operationId: 'notifications_updatePreference',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferência atualizada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos',
    type: ValidationErrorResponseDto,
  })
  async updatePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.updatePreferenceUseCase.execute(user.tenantId, user.id, dto);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Contar notificações não lidas',
    description:
      'Retorna a quantidade de notificações não lidas do usuário autenticado. Ideal para exibir o badge no sino de notificações.',
    operationId: 'notifications_getUnreadCount',
  })
  @ApiResponse({
    status: 200,
    description: 'Contagem retornada com sucesso',
    schema: {
      example: { count: 7 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsRepository.getUnreadCount(
      user.tenantId,
      user.id,
    );
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Marcar notificação como lida',
    description: 'Marca uma notificação específica como lida pelo usuário autenticado.',
    operationId: 'notifications_markAsRead',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da notificação',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada',
    type: NotFoundResponseDto,
  })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.markAsReadUseCase.execute(user.tenantId, user.id, id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Marcar todas as notificações como lidas',
    description:
      'Marca todas as notificações não lidas do usuário autenticado como lidas de uma só vez.',
    operationId: 'notifications_markAllAsRead',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas com sucesso',
    schema: {
      example: { count: 12 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.markAllAsReadUseCase.execute(
      user.tenantId,
      user.id,
    );
    return { count };
  }

  @Post('test-dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Interno] Disparar notificação de teste',
    description:
      '**Endpoint interno** para simular o disparo de uma notificação via Use Case. Não deve ser exposto em produção. Requer o header `x-tenant-id` em vez de JWT.',
    operationId: 'notifications_testDispatch',
  })
  @ApiHeader({
    name: 'x-tenant-id',
    description: 'UUID do Tenant para o qual a notificação será disparada',
    required: true,
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação disparada com sucesso',
    schema: {
      example: { success: true },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos',
    type: ValidationErrorResponseDto,
  })
  async testDispatch(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    // Agora usando o Use Case que dispara os eventos de domínio automaticamente
    await this.createNotificationUseCase.execute(tenantId, dto);
    return { success: true };
  }
}
