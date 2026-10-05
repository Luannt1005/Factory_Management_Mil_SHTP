import VisitorRequestView from "@/features/visitor/request/components/VisitorRequestView";
import VisitorDashboardView from "@/features/visitor/dashboard/components/VisitorDashboardView";

export default function Page() {
    return <VisitorRequestView dashboardSlot={<VisitorDashboardView />} />;
}
