import { User } from '../entities/users/user.entity';

export abstract class UserRepository {
    abstract create(user: User): Promise<User>;
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract update(user: User): Promise<User>;
    abstract countByTenant(tenantId: string): Promise<number>;
}
