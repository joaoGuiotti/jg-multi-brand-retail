import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { MarkAllAsReadUseCase } from '../mark-all-as-read.use-case';

describe('MarkAllAsReadUseCase', () => {
  let useCase: MarkAllAsReadUseCase;
  let repository: jest.Mocked<INotificationsRepository>;

  beforeEach(() => {
    repository = {
      markAllAsRead: jest.fn(),
    } as any;
    useCase = new MarkAllAsReadUseCase(repository);
  });

  it('should call repository to mark all as read', async () => {
    const tenantId = 't1';
    const userId = 'u1';

    repository.markAllAsRead.mockResolvedValue(5);

    const result = await useCase.execute(tenantId, userId);

    expect(result).toBe(5);
    expect(repository.markAllAsRead).toHaveBeenCalledWith(tenantId, userId);
  });
});
