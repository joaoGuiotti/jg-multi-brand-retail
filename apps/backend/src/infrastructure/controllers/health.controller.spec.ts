import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../persistence/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return status ok when database is reachable', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.timestamp).toBeDefined();
  });

  it('should return status error when database fails', async () => {
    prisma.$queryRawUnsafe.mockRejectedValueOnce(
      new Error('DB connection lost'),
    );
    const result = await controller.check();
    expect(result.status).toBe('error');
    expect(result.database).toBe('disconnected');
    expect(result.timestamp).toBeDefined();
  });
});
