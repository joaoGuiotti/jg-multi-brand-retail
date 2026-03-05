import { User } from '../entities/users/user.entity';

export abstract class UserRepository {
    abstract create(tenantId: string, user: User): Promise<User>;
    abstract findById(tenantId: string, id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<{ user: User, tenantId: string } | null>;
    abstract update(tenantId: string, user: User): Promise<User>;
    abstract countByTenant(tenantId: string): Promise<number>;
}
