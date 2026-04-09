/**
 * Supabase Database Types
 * Auto-generated types for PostgreSQL tables
 */

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    username: string;
                    password: string;
                    full_name: string;
                    role: 'user' | 'admin' | 'viewer';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    username: string;
                    password: string;
                    full_name: string;
                    role?: 'user' | 'admin' | 'viewer';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string;
                    password?: string;
                    full_name?: string;
                    role?: 'user' | 'admin' | 'viewer';
                    updated_at?: string;
                };
            };
            employees: {
                Row: {
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
                    line_manager: string | null;
                    joining_date: string | null;
                    last_working_day: string | null;
                    line_manager_status: string | null;
                    pending_line_manager: string | null;
                    imported_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    emp_id: string;
                    full_name?: string | null;
                    job_title?: string | null;
                    dept?: string | null;
                    bu?: string | null;
                    bu_org_3?: string | null;
                    dl_idl_staff?: string | null;
                    location?: string | null;
                    employee_type?: string | null;
                    line_manager?: string | null;
                    joining_date?: string | null;
                    last_working_day?: string | null;
                    line_manager_status?: string | null;
                    pending_line_manager?: string | null;
                    imported_at?: string;
                    updated_at?: string;
                };
                Update: {
                    emp_id?: string;
                    full_name?: string | null;
                    job_title?: string | null;
                    dept?: string | null;
                    bu?: string | null;
                    bu_org_3?: string | null;
                    dl_idl_staff?: string | null;
                    location?: string | null;
                    employee_type?: string | null;
                    line_manager?: string | null;
                    joining_date?: string | null;
                    last_working_day?: string | null;
                    line_manager_status?: string | null;
                    pending_line_manager?: string | null;
                    updated_at?: string;
                };
            };
            orgchart_nodes: {
                Row: {
                    id: string;
                    pid: string | null;
                    stpid: string | null;
                    name: string | null;
                    title: string | null;
                    image: string | null;
                    tags: string[] | null;
                    orig_pid: string | null;
                    dept: string | null;
                    bu: string | null;
                    type: string | null;
                    location: string | null;
                    description: string | null;
                    joining_date: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    pid?: string | null;
                    stpid?: string | null;
                    name?: string | null;
                    title?: string | null;
                    image?: string | null;
                    tags?: string[] | null;
                    orig_pid?: string | null;
                    dept?: string | null;
                    bu?: string | null;
                    type?: string | null;
                    location?: string | null;
                    description?: string | null;
                    joining_date?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    pid?: string | null;
                    stpid?: string | null;
                    name?: string | null;
                    title?: string | null;
                    image?: string | null;
                    tags?: string[] | null;
                    orig_pid?: string | null;
                    dept?: string | null;
                    bu?: string | null;
                    type?: string | null;
                    location?: string | null;
                    description?: string | null;
                    joining_date?: string | null;
                    updated_at?: string;
                };
            };
            custom_orgcharts: {
                Row: {
                    id: string;
                    username: string;
                    orgchart_name: string;
                    description: string | null;
                    org_data: Record<string, any>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    username: string;
                    orgchart_name: string;
                    description?: string | null;
                    org_data?: Record<string, any>;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    username?: string;
                    orgchart_name?: string;
                    description?: string | null;
                    org_data?: Record<string, any>;
                    updated_at?: string;
                };
            };
        };
    };
}

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export type OrgchartNode = Database['public']['Tables']['orgchart_nodes']['Row'];
export type OrgchartNodeInsert = Database['public']['Tables']['orgchart_nodes']['Insert'];
export type OrgchartNodeUpdate = Database['public']['Tables']['orgchart_nodes']['Update'];

export type CustomOrgchart = Database['public']['Tables']['custom_orgcharts']['Row'];
export type CustomOrgchartInsert = Database['public']['Tables']['custom_orgcharts']['Insert'];
export type CustomOrgchartUpdate = Database['public']['Tables']['custom_orgcharts']['Update'];
