import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationOutput } from '@common/application/pagination-output';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import {
  NotificationEntity,
  NotificationType,
  NotificationPriority,
} from '../../../domain/entities/notifications/notification.entity';
import { NotificationPreferenceEntity } from '../../../domain/entities/notifications/notification-preference.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

@Injectable()
export class PrismaNotificationsRepository implements INotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(dbRecord: any): NotificationEntity {
    return NotificationEntity.create(
      {
        tenantId: dbRecord.tenantId,
        userId: dbRecord.userId,
        type: dbRecord.type as NotificationType,
        priority: dbRecord.priority as NotificationPriority,
        title: dbRecord.title,
        message: dbRecord.message,
        data: dbRecord.data as Record<string, any> | undefined,
        actionUrl: dbRecord.actionUrl,
        readAt: dbRecord.readAt,
        createdAt: dbRecord.createdAt,
      },
      new UniqueEntityID(dbRecord.id),
    );
  }

  private mapToPreferenceEntity(dbRecord: any): NotificationPreferenceEntity {
    return new NotificationPreferenceEntity({
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      userId: dbRecord.userId,
      type: dbRecord.type as NotificationType,
      enabled: dbRecord.enabled,
      sound: dbRecord.sound,
    });
  }

  async create(notification: NotificationEntity): Promise<NotificationEntity> {
    const created = await this.prisma.notification.create({
      data: {
        id: notification.id.toString(),
        tenantId: notification.tenantId,
        userId: notification.userId,
        type: notification.type as any,
        priority: notification.priority as any,
        title: notification.title,
        message: notification.message,
        data: notification.data ?? undefined,
        actionUrl: notification.actionUrl,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<NotificationEntity | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
    });
    return notification ? this.mapToEntity(notification) : null;
  }

  async markAsRead(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<NotificationEntity | null> {
    // Note: Em uma arquitetura DDD pura, o Use Case deveria carregar a entidade,
    // chamar markAsRead() nela e depois salvar.
    // Mantemos este método para compatibilidade, mas ele agora retorna a entidade mapeada.
    const updated = await this.prisma.notification.updateMany({
      where: { id, tenantId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) {
      // Se já está lida, retornamos a entidade atualizada
      const current = await this.findById(id, tenantId, userId);
      return current;
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    return notification ? this.mapToEntity(notification) : null;
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<number> {
    const updated = await this.prisma.notification.updateMany({
      where: { tenantId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return updated.count;
  }

  async getUserNotifications(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationOutput<NotificationEntity>> {
    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where: { tenantId, userId } }),
      this.prisma.notification.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((n) => this.mapToEntity(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    });
  }

  async getUserPreferences(
    tenantId: string,
    userId: string,
  ): Promise<NotificationPreferenceEntity[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { tenantId, userId },
    });
    return preferences.map((p) => this.mapToPreferenceEntity(p));
  }

  async updatePreference(
    preference: NotificationPreferenceEntity,
  ): Promise<NotificationPreferenceEntity> {
    const updated = await this.prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: preference.userId,
          type: preference.type as any,
        },
      },
      create: {
        id: preference.id,
        tenantId: preference.tenantId,
        userId: preference.userId,
        type: preference.type as any,
        enabled: preference.enabled,
        sound: preference.sound,
      },
      update: {
        enabled: preference.enabled,
        sound: preference.sound,
      },
    });
    return this.mapToPreferenceEntity(updated);
  }

  async getPreferenceByType(
    tenantId: string,
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreferenceEntity | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type: type as any,
        },
      },
    });
    if (!preference) return null;
    if (preference.tenantId !== tenantId) return null;
    return this.mapToPreferenceEntity(preference);
  }
}
