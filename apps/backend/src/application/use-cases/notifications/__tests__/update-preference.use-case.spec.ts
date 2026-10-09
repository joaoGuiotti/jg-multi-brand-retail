import { NotificationType } from '../../../../domain/entities/notifications/notification.entity';
import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { UpdatePreferenceUseCase } from '../update-preference.use-case';

describe('UpdatePreferenceUseCase', () => {
  let useCase: UpdatePreferenceUseCase;
  let repository: jest.Mocked<INotificationsRepository>;

  beforeEach(() => {
    repository = {
      updatePreference: jest.fn(),
    } as any;
    useCase = new UpdatePreferenceUseCase(repository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository to update preference', async () => {
    const tenantId = 't1';
    const userId = 'u1';
    const dto = {
      type: NotificationType.SYSTEM,
      enabled: false,
      sound: true,
    };

    repository.updatePreference.mockResolvedValue({
      id: 'pref-1',
      tenantId,
      userId,
      ...dto,
    });

    const result = await useCase.execute(tenantId, userId, dto);

    expect(result.enabled).toBe(false);
    expect(repository.updatePreference).toHaveBeenCalled();
  });
});
