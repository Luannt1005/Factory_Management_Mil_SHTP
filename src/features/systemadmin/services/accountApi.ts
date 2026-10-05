/**
 * Account Self-Service API
 * Orgchart_TTI_onprem
 *
 * Profile view/update, password change and local account signup.
 * Methods return the parsed response envelope unchanged so callers keep their existing success/error handling.
 */

import type {
    UserProfile,
    ProfileApiResponse,
    ChangePasswordPayload,
    SignupPayload,
    SignupApiResponse,
} from '@/types/user.types';

const ENDPOINTS = {
    PROFILE: '/api/profile',
    PROFILE_PASSWORD: '/api/profile/password',
    SIGNUP: '/api/signup',
} as const;

export const accountApi = {
    ENDPOINTS,

    /**
     * GET /api/profile
     */
    async getProfile(): Promise<ProfileApiResponse<Partial<UserProfile>>> {
        const res = await fetch(ENDPOINTS.PROFILE);
        return res.json();
    },

    /**
     * PUT /api/profile
     */
    async updateProfile(profile: UserProfile): Promise<ProfileApiResponse<Pick<UserProfile, 'full_name'>>> {
        const res = await fetch(ENDPOINTS.PROFILE, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
        });
        return res.json();
    },

    /**
     * PUT /api/profile/password
     */
    async changePassword(payload: ChangePasswordPayload): Promise<ProfileApiResponse> {
        const res = await fetch(ENDPOINTS.PROFILE_PASSWORD, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    /**
     * POST /api/signup
     */
    async signup(payload: SignupPayload): Promise<SignupApiResponse> {
        const res = await fetch(ENDPOINTS.SIGNUP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.json();
    },
};
