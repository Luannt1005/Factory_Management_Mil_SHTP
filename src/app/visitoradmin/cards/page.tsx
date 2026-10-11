import { Suspense } from "react";
import CardStudioView from "@/features/visitor/cards/components/CardStudioView";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <CardStudioView />
        </Suspense>
    );
}
