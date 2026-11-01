import type { OrgChartNode } from "@/types/orgchart.types";

/** Employee the default orgchart view starts from (Lee Hon Kay, VP of Operations) */
export const ORG_SCOPE_ROOT_ID = "500011";
export const ORG_SCOPE_ROOT_NAME = "Lee Hon Kay";

/**
 * Ids of everything below `rootId` (the root included).
 * A node hangs under its manager (pid) and its department group (stpid); department groups hang under
 * the manager (pid), so following both links walks the whole branch, groups included.
 */
export function collectSubtreeIds(nodes: OrgChartNode[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  const link = (parent: string | number | null | undefined, child: string) => {
    if (parent == null || parent === "") return;
    const key = String(parent);
    const list = children.get(key);
    if (list) list.push(child);
    else children.set(key, [child]);
  };
  for (const n of nodes) {
    link(n.pid, String(n.id));
    link(n.stpid, String(n.id));
  }

  const ids = new Set<string>();
  if (!nodes.some((n) => String(n.id) === rootId)) return ids;
  const stack = [rootId];
  ids.add(rootId);
  while (stack.length) {
    for (const child of children.get(stack.pop()!) ?? []) {
      if (!ids.has(child)) {
        ids.add(child);
        stack.push(child);
      }
    }
  }
  return ids;
}
