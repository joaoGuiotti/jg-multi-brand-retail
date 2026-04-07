import { User as PrismaUser } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { User } from '../../../domain/entities/users/user.entity';

export class UserMapper {
    static toDomain(raw: PrismaUser): User {
        return User.create(
            {
                email: raw.email,
                passwordHash: raw.passwordHash,
                role: raw.role,
                name: raw.name,
                active: raw.active,
                twoFaSecret: raw.twoFaSecret,
                tokenVersion: raw.tokenVersion,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            new UniqueEntityID(raw.id),
        );
    }

    static toPersistence(user: User) {
        return {
            id: user.id.toString(),
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            name: user.name,
            active: user.active,
            twoFaSecret: user.twoFaSecret,
            tokenVersion: user.tokenVersion,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
