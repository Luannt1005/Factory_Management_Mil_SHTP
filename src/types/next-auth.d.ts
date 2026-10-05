/**
 * NextAuth Session augmentation
 * Mirrors the fields populated by the `session` callback in src/lib/authOptions.ts.
 * All custom fields are optional because older tokens / legacy flows may not carry them.
 */
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user?: DefaultSession['user'] & {
            id?: string;
            username?: string;
            full_name?: string;
            role?: string;
            orgchart_role?: string;
            visitor_role?: string;
            app_role_ids?: string[];
            app_role_names?: string[];
            allowedPages?: string[];
            jobTitle?: string;
            department?: string;
            location?: string;
        };
    }
}
