declare module "@/lib/orgchart" {
    export default class OrgChart {
        constructor(element: HTMLElement | null, config: any);

        static templates: { [key: string]: any };
        static icon: any;
        static action: any;
        static editUI: any;
        static match: any;
        static none: any;
        static normal: any;
        static mixed: any;
        static tree: any;
        static treeLeftOffset: any;
        static treeRightOffset: any;
        static orientation: any;
        static event: any;
        static events: any;
        static randomId(): string;

        load(data: any[], callback?: () => void): void;
        on(event: string, callback: (...args: any[]) => void): void;
        get(id: string | number): any;
        getNode(id: string | number): any;
        updateNode(node: any): void;
        addNode(node: any): void;
        removeNode(id: string | number): void;
        destroy(): void;
        draw(action: any): void;
        /** Expands to and centers a node (options: parentState, childrenState, rippleId, vertical, horizontal) */
        center(id: string | number, options?: { parentState?: number; childrenState?: number; rippleId?: string | number; vertical?: boolean; horizontal?: boolean }, callback?: () => void): void;
        /** Expands `expandIds` and collapses `collapseIds` in one redraw */
        expandCollapse(id: string | number, expandIds: (string | number)[], collapseIds: (string | number)[], callback?: () => void): void;

        // Config properties
        config: any;
    }
}
