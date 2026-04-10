import { Role } from '@prisma/client';

export type AuthTokenOutput = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserOutput = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
};

export type AuthOutput = {
  accessToken: string;
  refreshToken: string;
};

export type UserProfileOutput = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
};
