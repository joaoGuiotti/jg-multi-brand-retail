import { NotificationEntity } from '@domain/entities/notifications/notification.entity';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class NotificationPresenter {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  actionUrl?: string;

  @ApiProperty({ nullable: true })
  @Transform(({ value }) => value?.toISOString())
  readAt?: Date;

  @ApiProperty()
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  constructor(entity: NotificationEntity) {
    this.id = entity.id.toString();
    this.tenantId = entity.tenantId;
    this.userId = entity.userId;
    this.type = entity.type;
    this.priority = entity.priority;
    this.title = entity.title;
    this.message = entity.message;
    this.actionUrl = entity.actionUrl;
    this.readAt = entity.readAt || undefined;
    this.createdAt = entity.createdAt;
  }
}

export class NotificationCollectionPresenter extends CollectionPresenter {
  @ApiProperty({ type: [NotificationPresenter] })
  data: NotificationPresenter[];

  constructor(output: PaginationOutput<NotificationEntity>) {
    const paginationProps: PaginationPresenterProps = {
      page: output.meta.page,
      limit: output.meta.limit,
      totalPages: output.meta.totalPages,
      total: output.meta.total,
    };
    super(paginationProps);
    this.data = output.data.map((item) => new NotificationPresenter(item));
  }
}
