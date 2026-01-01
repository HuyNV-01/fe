"use client";

import type { TStoreStatus } from "@/types/store";

export function useStoreWait(
  statuses: TStoreStatus | TStoreStatus[],
  waitValues: TStoreStatus[] = ["loading", "wait"],
): boolean {
  const statusList = Array.isArray(statuses) ? statuses : [statuses];

  return statusList.some((status) => waitValues.includes(status));
}
