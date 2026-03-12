import { UseCase } from '@common/application/use-case.interface';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfileOutput } from './common/auth-output';

export type GetProfileInput = {
    userId: string;
    tenantId: string;
}

@Injectable()
export class GetProfileUseCase implements UseCase<GetProfileInput, UserProfileOutput> {
    constructor(
        private userRepository: UserRepository,
        private tenantRepository: TenantRepository,
    ) { }

    async execute(input: GetProfileInput): Promise<UserProfileOutput> {
        const { userId, tenantId } = input;
        const user = await this.userRepository.findById(tenantId, userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const tenant = await this.tenantRepository.findById(tenantId);

        return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            active: user.active,
            tenant: tenant ? {
                id: tenant.id.toString(),
                name: tenant.name,
                slug: tenant.slug,
                logoUrl: tenant.logoUrl,
            } : null,
        };
    }
}
