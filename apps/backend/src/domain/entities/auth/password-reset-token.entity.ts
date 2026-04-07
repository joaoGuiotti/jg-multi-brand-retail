import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface PasswordResetTokenProps {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt?: Date;
}

export class PasswordResetToken {
    private readonly _id: UniqueEntityID;
    private readonly props: PasswordResetTokenProps;

    private constructor(props: PasswordResetTokenProps, id?: UniqueEntityID) {
        this._id = id ?? new UniqueEntityID();
        this.props = {
            ...props,
            createdAt: props.createdAt ?? new Date(),
        };
    }

    public static create(props: PasswordResetTokenProps, id?: UniqueEntityID): PasswordResetToken {
        return new PasswordResetToken(props, id);
    }

    get id(): UniqueEntityID { return this._id; }
    get tenantId(): string { return this.props.tenantId; }
    get userId(): string { return this.props.userId; }
    get tokenHash(): string { return this.props.tokenHash; }
    get expiresAt(): Date { return this.props.expiresAt; }
    get usedAt(): Date | null { return this.props.usedAt; }
    get createdAt(): Date | undefined { return this.props.createdAt; }

    isExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    isUsed(): boolean {
        return this.props.usedAt !== null;
    }

    isValid(): boolean {
        return !this.isExpired() && !this.isUsed();
    }
}
