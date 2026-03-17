import { UseCase } from '@common/application/use-case.interface';
import { User } from '@domain/entities/users/user.entity';
import { UserRepository } from '@domain/repositories/user-repository';
import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export type CreateUserInput = {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role: Role;
}

export type CreateUserOutput = {
    id: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
}

@Injectable()
export class CreateUserUseCase implements UseCase<CreateUserInput, CreateUserOutput> {
    constructor(
        private userRepository: UserRepository,
    ) { }

    async execute(input: CreateUserInput): Promise<CreateUserOutput> {
        // Check if user already exists
        const result = await this.userRepository.findByEmail(input.email);

        if (result) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user
        const user = User.create({
            email: input.email,
            passwordHash,
            name: input.name,
            role: input.role,
            active: true,
        });

        await this.userRepository.create(input.tenantId, user);

        return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role as Role,
            active: user.active,
        };
    }
}
