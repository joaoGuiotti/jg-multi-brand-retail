import { User } from '@domain/entities/users/user.entity';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable } from '@nestjs/common';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, user: User): Promise<User> {
        const data = UserMapper.toPersistence(user);
        const created = await this.prisma.user.create({
            data: {
                ...data,
                tenantId,
            },
        });
        return UserMapper.toDomain(created);
    }

    async findById(tenantId: string, id: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
        });
        return user ? UserMapper.toDomain(user) : null;
    }

    async findByEmail(email: string): Promise<{ user: User, tenantId: string } | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? { user: UserMapper.toDomain(user), tenantId: user.tenantId } : null;
    }

    async update(tenantId: string, user: User): Promise<User> {
        const data = UserMapper.toPersistence(user);
        const updated = await this.prisma.user.update({
            where: {
                id: user.id.toString(),
                tenantId,
            },
            data,
        });
        return UserMapper.toDomain(updated);
    }

    async countByTenant(tenantId: string): Promise<number> {
        return this.prisma.user.count({ where: { tenantId } });
    }

    async findAllByTenant(tenantId: string): Promise<User[]> {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
        });
        return users.map(user => UserMapper.toDomain(user));
    }
}
