import { AuthOutput, UserProfileOutput } from '@application/use-cases/auth/common/auth-output';

export class AuthPresenter {
    accessToken: string;
    refreshToken: string;

    constructor(output: AuthOutput) {
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
    tenant: { id: string; name: string; slug: string; logoUrl?: string | null } | null;

    constructor(output: UserProfileOutput) {
        this.id = output.id;
        this.email = output.email;
        this.name = output.name;
        this.role = output.role;
        this.active = output.active;
        this.tenant = output.tenant
            ? { id: output.tenant.id, name: output.tenant.name, slug: output.tenant.slug, logoUrl: output.tenant.logoUrl }
            : null;
    }
}
