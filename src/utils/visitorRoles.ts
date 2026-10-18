/**
 * Visitor-domain role checks (pure, shared by client views and API route handlers).
 */

/** App role (app_roles.name) that grants full Visitor administration */
export const VISITOR_ADMIN_APP_ROLE = 'Admin Visitor';
/** App role (app_roles.name) of the reception desk */
export const RECEPTIONIST_APP_ROLE = 'Receptionist';

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

/** Visitor Card Studio - Card Design tab and template changes: Visitor admins only */
export function canDesignVisitorCards(user: VisitorRoleSubject | null | undefined): boolean {
    return isVisitorAdmin(user);
}

/** Visitor Card Studio - Print Cards tab (read templates, look up requests): Visitor admins and Receptionists */
export function canPrintVisitorCards(user: VisitorRoleSubject | null | undefined): boolean {
    return isVisitorAdmin(user) || (user?.app_role_names ?? []).includes(RECEPTIONIST_APP_ROLE);
}
