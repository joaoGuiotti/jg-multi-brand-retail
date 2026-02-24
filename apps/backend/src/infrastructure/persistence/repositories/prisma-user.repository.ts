import { User } from '@domain/entities/users/user.entity';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable } from '@nestjs/common';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
    constructor(private prisma: PrismaService) { }

    async create(user: User): Promise<User> {
        const data = UserMapper.toPersistence(user);
        const created = await this.prisma.user.create({ data });
        return UserMapper.toDomain(created);
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? UserMapper.toDomain(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? UserMapper.toDomain(user) : null;
    }

    async update(user: User): Promise<User> {
        const data = UserMapper.toPersistence(user);
        const updated = await this.prisma.user.update({
            where: { id: user.id.toString() },
            data,
        });
        return UserMapper.toDomain(updated);
    }

    async countByTenant(tenantId: string): Promise<number> {
        return this.prisma.user.count({ where: { tenantId } });
    }
}
