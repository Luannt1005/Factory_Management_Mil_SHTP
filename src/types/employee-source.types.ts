/**
 * One employee row in the shape of the legacy `employees` table, built from the employee
 * master database (HR) merged with the app's own edits (overrides) and manual rows (open headcount).
 */
export interface EmployeeRecord {
    /** HR employees: their emp_id. Manual rows: uuid from employee_manual_rows. */
    id: string;
    emp_id: string;
    full_name: string | null;
    job_title: string | null;
    dept: string | null;
    bu: string | null;
    bu_org_3: string | null;
    dl_idl_staff: string | null;
    location: string | null;
    employee_type: string | null;
    /** "<manager emp_id>:<manager name>" */
    line_manager: string | null;
    /** Excel serial day number as text (legacy format) */
    joining_date: string | null;
    last_working_day: string | null;
    line_manager_status: string | null;
    pending_line_manager: string | null;
    is_direct: string | null;
    requester: string | null;
    /** 'Active' | 'Resigned' | 'Future' */
    status: string | null;
    /** Office email from HR (read-only, null for manual rows) */
    email: string | null;
    /** Teams display name from HR, e.g. "Anna Ly Bich Phuong (VN.MIL-PT-MC)" (read-only, null for manual rows) */
    display_name: string | null;
    /** Employee cost center, falling back to the department's (read-only, null for manual rows) */
    cost_center: string | null;
    /** Where the row comes from */
    source: 'hr' | 'manual';
}

/** Columns the app may change on an employee (overrides for HR rows, values for manual rows) */
export type EmployeeEditableField =
    | 'emp_id'
    | 'full_name'
    | 'job_title'
    | 'dept'
    | 'bu'
    | 'bu_org_3'
    | 'dl_idl_staff'
    | 'location'
    | 'employee_type'
    | 'line_manager'
    | 'is_direct'
    | 'joining_date'
    | 'line_manager_status'
    | 'pending_line_manager'
    | 'requester';

export type EmployeeEdit = Partial<Record<EmployeeEditableField, string | null>>;
