/**
 * Visitor-domain role checks (pure, shared by client views and API route handlers).
 */

/** App role (app_roles.name) that grants full Visitor administration */
export const VISITOR_ADMIN_APP_ROLE = 'Admin Visitor';

interface VisitorRoleSubject {
    role?: string | null;
    visitor_role?: string | null;
    app_role_names?: readonly string[] | null;
}

/** Global admins, users with visitor_role 'admin', or users holding the "Admin Visitor" app role */
export function isVisitorAdmin(user: VisitorRoleSubject | null | undefined): boolean {
    if (!user) return false;
    return (
        user.role === 'admin' ||
        user.visitor_role === 'admin' ||
        (user.app_role_names ?? []).includes(VISITOR_ADMIN_APP_ROLE)
    );
}
