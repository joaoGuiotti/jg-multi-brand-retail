import { UseCase } from '@common/application/use-case.interface';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

export type ListUsersInput = {
  tenantId: string;
};

export type UserOutput = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
};

export type ListUsersOutput = UserOutput[];

@Injectable()
export class ListUsersUseCase implements UseCase<
  ListUsersInput,
  ListUsersOutput
> {
  constructor(private userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    const users = await this.userRepository.findAllByTenant(input.tenantId);

    return users.map((user) => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
    }));
  }
}
