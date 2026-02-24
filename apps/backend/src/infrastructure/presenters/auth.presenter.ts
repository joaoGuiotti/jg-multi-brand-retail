import { AuthOutput, UserProfileOutput } from '@application/use-cases/auth/common/auth-output';

export class AuthPresenter {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
    };
    accessToken: string;
    refreshToken: string;

    constructor(output: AuthOutput) {
        this.user = {
            id: output.user.id,
            email: output.user.email,
            name: output.user.name,
            role: output.user.role,
            tenant: {
                id: output.user.tenant.id,
                name: output.user.tenant.name,
                slug: output.user.tenant.slug,
            },
        };
        this.accessToken = output.accessToken;
        this.refreshToken = output.refreshToken;
    }
}

export class UserProfilePresenter {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    tenant: { id: string; name: string; slug: string } | null;

    constructor(output: UserProfileOutput) {
        this.id = output.id;
        this.email = output.email;
        this.name = output.name;
        this.role = output.role;
        this.active = output.active;
        this.tenant = output.tenant
            ? { id: output.tenant.id, name: output.tenant.name, slug: output.tenant.slug }
            : null;
    }
}
