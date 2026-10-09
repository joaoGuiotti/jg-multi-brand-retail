import { Role } from '@prisma/client';
import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface UserProps {
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  active: boolean;
  twoFaSecret?: string | null;
  tokenVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: UserProps, id?: UniqueEntityID): User {
    const user = new User(
      {
        ...props,
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return user;
  }

  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get name(): string {
    return this.props.name;
  }
  get active(): boolean {
    return this.props.active;
  }
  get twoFaSecret(): string | undefined | null {
    return this.props.twoFaSecret;
  }
  get tokenVersion(): number {
    return this.props.tokenVersion ?? 1;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  public updateRole(role: Role): void {
    this.props.role = role;
    this.props.updatedAt = new Date();
  }

  public updatePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.props.tokenVersion = (this.props.tokenVersion ?? 1) + 1;
    this.props.updatedAt = new Date();
  }

  public revokeAllSessions(): void {
    this.props.tokenVersion = (this.props.tokenVersion ?? 1) + 1;
    this.props.updatedAt = new Date();
  }

  toJson() {
    return {
      id: this.id.toString(),
      email: this.props.email,
      passwordHash: this.props.passwordHash,
      role: this.props.role,
      name: this.props.name,
      active: this.props.active,
      twoFaSecret: this.props.twoFaSecret,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
