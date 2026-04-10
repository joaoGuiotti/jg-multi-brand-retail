import { Test, TestingModule } from '@nestjs/testing';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { CreateNotificationUseCase } from '../../application/use-cases/notifications/create-notification.use-case';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../domain/repositories/notifications/notifications.repository.interface';
import { OperationalStreamService } from './operational-stream.service';
import { NotificationType, NotificationPriority } from '../../domain/entities/notifications/notification.entity';

describe('NotificationDispatcherService', () => {
  let service: NotificationDispatcherService;
  let gateway: any;
  let createUseCase: any;
  let repository: any;
  let sseService: any;

  beforeEach(async () => {
    gateway = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    };

    createUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'not-1', title: 'Test' }),
    };

    repository = {
      getPreferenceByType: jest.fn().mockResolvedValue({ enabled: true, sound: true }),
    };

    sseService = {
      pushEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatcherService,
        { provide: NotificationsGateway, useValue: gateway },
        { provide: CreateNotificationUseCase, useValue: createUseCase },
        { provide: INOTIFICATIONS_REPOSITORY_TOKEN, useValue: repository },
        { provide: OperationalStreamService, useValue: sseService },
      ],
    }).compile();

    service = module.get<NotificationDispatcherService>(NotificationDispatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dispatch notification when preferences are enabled', async () => {
    const tenantId = 't1';
    const dto = {
      userId: 'u1',
      type: NotificationType.SYSTEM,
      title: 'Hello',
      message: 'World',
      priority: NotificationPriority.HIGH,
    };

    await service.dispatch(tenantId, dto);

    expect(createUseCase.execute).toHaveBeenCalled();
    expect(gateway.server.to).toHaveBeenCalledWith('t1:u1');
    expect(gateway.server.emit).toHaveBeenCalledWith('notification_receive', expect.any(Object));
    expect(sseService.pushEvent).toHaveBeenCalled();
  });

  it('should suppress notification when preference is disabled', async () => {
    repository.getPreferenceByType.mockResolvedValue({ enabled: false });

    const tenantId = 't1';
    const dto = {
      userId: 'u1',
      type: NotificationType.SYSTEM,
      title: 'Hello',
      message: 'World',
    };

    await service.dispatch(tenantId, dto);

    expect(createUseCase.execute).not.toHaveBeenCalled();
    expect(gateway.server.emit).not.toHaveBeenCalled();
  });
});
