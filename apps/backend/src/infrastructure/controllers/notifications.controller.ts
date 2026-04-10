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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('notifications')
@ApiBearerAuth()
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
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.getUserPreferencesUseCase.execute(user.tenantId, user.id);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.updatePreferenceUseCase.execute(user.tenantId, user.id, dto);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsRepository.getUnreadCount(
      user.tenantId,
      user.id,
    );
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.markAsReadUseCase.execute(user.tenantId, user.id, id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.markAllAsReadUseCase.execute(
      user.tenantId,
      user.id,
    );
    return { count };
  }

  @Post('test-dispatch')
  async testDispatch(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    // Agora usando o Use Case que dispara os eventos de domínio automaticamente
    await this.createNotificationUseCase.execute(tenantId, dto);
    return { success: true };
  }
}
