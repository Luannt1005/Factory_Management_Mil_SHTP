import { useState, useCallback, useEffect } from "react";
import { User } from "@/types/database";
import { orgchartApi } from "@/features/orgchart/services/orgchartApi";

export interface OrgProfile {
    orgchart_id: string;
    orgchart_name: string;
    created_at?: string;
    is_public?: boolean;
    [key: string]: any;
}

interface UseOrgProfileManagerProps {
    user: User | null | undefined;
}

export function useOrgProfileManager({ user }: UseOrgProfileManagerProps) {
    const [orgList, setOrgList] = useState<OrgProfile[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const username = user?.username || "admin";

    /* ================= LOAD USER'S CUSTOM ORGCHARTS ================= */
    const fetchOrgList = useCallback(async () => {
        if (!username) return;
        try {
            const data = await orgchartApi.getUserCustomOrgcharts(username);
            setOrgList(data.orgcharts || []);
        } catch (err) {
            console.error("❌ Load orgcharts error:", err);
        } finally {
            setLoadingList(false);
        }
    }, [username]);

    // Initial load
    useEffect(() => {
        if (username) {
            fetchOrgList();
        }
    }, [username, fetchOrgList]);

    /* ================= CREATE NEW ORGCHART ================= */
    // Helper to actually perform the POST (split for the empty data case override)
    const performCreate = async (newOrgName: string, description: string, nodes: any[], username: string) => {
        const result = await orgchartApi.createCustomOrgchart({
            username,
            orgchart_name: newOrgName,
            describe: description,
            org_data: { data: nodes }
        });

        await fetchOrgList(); // Reload list
        return result;
    };

    const createOrgChart = async (newOrgName: string, newOrgDesc: string, selectedDept: string) => {
        if (!username) throw new Error("Vui lòng đăng nhập để tạo sơ đồ");

        // Fetch selected department data
        const deptJson = await orgchartApi.getOrgchart({ dept: selectedDept });
        const nodes = deptJson.data || [];

        if (nodes.length === 0) {
            // We return a specialized object or throw to let UI handle confirmation
            throw new Error("EMPTY_DATA_CONFIRMATION_NEEDED");
        }

        const description = newOrgDesc || `Tạo từ phòng ban ${selectedDept}`;
        return await performCreate(newOrgName, description, nodes, username);
    };

    /* ================= DELETE ORGCHART ================= */
    const deleteOrgChart = async (orgId: string) => {
        await orgchartApi.deleteCustomOrgchart(orgId);
        await fetchOrgList(); // Reload list
        return true;
    };

    return {
        orgList,
        loadingList,
        fetchOrgList,
        createOrgChart,
        performCreate, // Exposed for the "Empty data" confirmation edge case
        deleteOrgChart
    };
}
