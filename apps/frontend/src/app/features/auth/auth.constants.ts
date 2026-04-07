/** Shared query parameter names used across auth pages */
export const AUTH_QUERY_PARAMS = {
    /** Set on /login URL after successful password reset */
    PASSWORD_RESET_SUCCESS: 'password_reset',
    /** Email pre-fill param for forgot-password page */
    EMAIL: 'email',
} as const;
