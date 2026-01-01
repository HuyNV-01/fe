export interface ActionCallbacks<TData = unknown, TError = string> {
  onSuccess?: (data?: TData) => void;
  onError?: (error?: TError) => void;
  onFinally?: () => void;
}
export type TStoreStatus = "idle" | "loading" | "failed" | "wait";

export interface HydrationState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
