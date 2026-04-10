import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { MarkAsReadUseCase } from '../mark-as-read.use-case';

describe('MarkAsReadUseCase', () => {
  let useCase: MarkAsReadUseCase;
  let repository: jest.Mocked<INotificationsRepository>;

  beforeEach(() => {
    repository = {
      toJSON: jest.fn(),
      markAsRead: jest.fn(),
    } as any;
    useCase = new MarkAsReadUseCase(repository);
  });

  it('should call repository to mark as read', async () => {
    const tenantId = 't1';
    const userId = 'u1';
    const id = 'not-1';

    repository.markAsRead.mockResolvedValue({ id, read: true } as any);

    const result = await useCase.execute(tenantId, userId, id);

    expect(result.read).toBe(true);
    expect(repository.markAsRead).toHaveBeenCalledWith(id, tenantId, userId);
  });
});
