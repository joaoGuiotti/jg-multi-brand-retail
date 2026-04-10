import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { GetUserNotificationsUseCase } from '../get-user-notifications.use-case';

describe('GetUserNotificationsUseCase', () => {
  let useCase: GetUserNotificationsUseCase;
  let repository: jest.Mocked<INotificationsRepository>;

  beforeEach(() => {
    repository = {
      getUserNotifications: jest.fn(),
    } as any;
    useCase = new GetUserNotificationsUseCase(repository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository with correct filters', async () => {
    const tenantId = 't1';
    const userId = 'u1';
    const filters = { page: 1, limit: 10 };

    repository.getUserNotifications.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    } as any);

    await useCase.execute(tenantId, userId, filters);

    expect(repository.getUserNotifications).toHaveBeenCalledWith(
      tenantId,
      userId,
      1,
      10,
    );
  });

  it('should use default values for page and limit when filters are empty', async () => {
    const tenantId = 't1';
    const userId = 'u1';
    const filters = {};

    repository.getUserNotifications.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    } as any);

    await useCase.execute(tenantId, userId, filters);

    expect(repository.getUserNotifications).toHaveBeenCalledWith(
      tenantId,
      userId,
      1,
      20,
    );
  });
});
