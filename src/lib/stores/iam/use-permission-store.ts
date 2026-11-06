import { createPersistedStore } from "@/lib/stores/create-persisted-store";
import { tStore } from "@/i18n/translate-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  acceptRoleInvitationApi,
  createShopAsOwnerApi,
  type DataScopeType,
  getOnboardingOverviewApi,
  joinShopByCodeApi,
  type MembershipStatusType,
  type SavedPageGroupPresetItem,
  savePageGroupPresetsApi,
  type ShiftStatusType,
  type ShopRoleType,
  switchActiveShopApi,
  updateShiftStatusApi,
} from "./api";

export type {
  DataScopeType,
  MembershipStatusType,
  SavedPageGroupPresetItem,
  ShiftStatusType,
  ShopRoleType,
};

export interface ShopMembershipSummary {
  memberId: string;
  shopId: string;
  shopCode: string;
  joinCode?: string;
  shopName: string;
  role: ShopRoleType;
  membershipStatus: MembershipStatusType;
  shiftStatus: ShiftStatusType;
}

export interface PendingInvitationSummary {
  invitationId: string;
  shopId: string;
  shopName: string;
  targetRole: ShopRoleType;
  invitedByName: string;
  expiresAt: string;
}

export interface EffectiveMemberContextPayload {
  shopId: string;
  userId: string;
  memberId: string;
  role: ShopRoleType;
  membershipStatus: MembershipStatusType;
  dataScope: DataScopeType;
  shiftStatus: ShiftStatusType;
  maxDiscountPercent: number;
  unmaskPhoneHourlyLimit: number;
  permissions: string[];
  allowedChannelIds: string[];
  allowedWarehouseIds: string[];
  savedPageGroupPresets?: SavedPageGroupPresetItem[];
}

export interface PermissionStoreState {
  onboardingState:
    | "UNBOUND_USER"
    | "PENDING_APPROVAL_ONLY"
    | "HAS_ACTIVE_SHOPS";
  activeShopId: string | null;
  role: ShopRoleType | null;
  membershipStatus: MembershipStatusType | null;
  dataScope: DataScopeType;
  shiftStatus: ShiftStatusType;
  maxDiscountPercent: number;
  unmaskPhoneHourlyLimit: number;
  permissions: string[];
  allowedChannelIds: string[];
  allowedWarehouseIds: string[];
  savedPageGroupPresets: SavedPageGroupPresetItem[];
  memberships: ShopMembershipSummary[];
  pendingInvitations: PendingInvitationSummary[];
  pendingHandoverCount: number;
  isHandoverModalOpen: boolean;
  isSwitchingShift: boolean;
  isLoadingOverview: boolean;
  membersRefreshTick: number;

  setActiveShopContext: (payload: Partial<PermissionStoreState>) => void;
  fetchOnboardingOverview: () => Promise<void>;
  applyRealtimeEffectiveContext: (ctx: EffectiveMemberContextPayload) => void;
  triggerMembersRefresh: () => void;
  createShopAsOwner: (payload: {
    shopName: string;
    contactPhone?: string;
    defaultAddressLine?: string;
  }) => Promise<boolean>;
  requestJoinByCode: (payload: {
    joinCode: string;
    requestedNote?: string;
  }) => Promise<boolean>;
  acceptInvitation: (idOrToken: string) => Promise<boolean>;
  switchShopWorkspace: (shopId: string) => Promise<boolean>;
  switchShiftStatus: (
    targetStatus: ShiftStatusType,
    handoverOptions?: {
      handoverMode: "AUTO_REDISTRIBUTE" | "TRANSFER_TO_AGENT" | "KEEP_ASSIGNED";
      targetHandoverAgentId?: string;
    },
  ) => Promise<boolean>;
  closeHandoverModal: () => void;
  savePageGroupPresets: (
    presets: SavedPageGroupPresetItem[],
  ) => Promise<boolean>;
  hasPermission: (code: string | string[]) => boolean;
  resetPermissionState: () => void;
}

export const usePermissionStore = createPersistedStore<PermissionStoreState>(
  (set, get) => ({
    onboardingState: "UNBOUND_USER",
    activeShopId: null,
    role: null,
    membershipStatus: null,
    dataScope: "ASSIGNED_ONLY",
    shiftStatus: "OFFLINE",
    maxDiscountPercent: 0,
    unmaskPhoneHourlyLimit: 0,
    permissions: [],
    allowedChannelIds: [],
    allowedWarehouseIds: [],
    savedPageGroupPresets: [],
    memberships: [],
    pendingInvitations: [],
    pendingHandoverCount: 0,
    isHandoverModalOpen: false,
    isSwitchingShift: false,
    isLoadingOverview: false,
    membersRefreshTick: 0,

    setActiveShopContext: (payload) => {
      set((state) => {
        Object.assign(state, payload);
      });
    },

    fetchOnboardingOverview: async () => {
      set((state) => {
        state.isLoadingOverview = true;
      });
      try {
        const res: any = await getOnboardingOverviewApi();
        const data = res?.data;
        if (!data) return;

        const ctx: EffectiveMemberContextPayload | null =
          data.activeShopContext || null;

        if (typeof window !== "undefined") {
          if (data.activeShopId) {
            localStorage.setItem("activeShopId", data.activeShopId);
          } else {
            localStorage.removeItem("activeShopId");
          }
        }

        set((state) => {
          state.onboardingState = data.onboardingState || "UNBOUND_USER";
          state.activeShopId = data.activeShopId || null;
          state.memberships = data.memberships || [];
          state.pendingInvitations = data.pendingInvitations || [];

          if (ctx && ctx.membershipStatus === "ACTIVE") {
            state.role = ctx.role;
            state.membershipStatus = ctx.membershipStatus;
            state.dataScope = ctx.dataScope;
            state.shiftStatus = ctx.shiftStatus;
            state.maxDiscountPercent = ctx.maxDiscountPercent;
            state.unmaskPhoneHourlyLimit = ctx.unmaskPhoneHourlyLimit;
            state.permissions = ctx.permissions || [];
            state.allowedChannelIds = ctx.allowedChannelIds || [];
            state.allowedWarehouseIds = ctx.allowedWarehouseIds || [];
            state.savedPageGroupPresets = ctx.savedPageGroupPresets || [];
          } else {
            state.role = null;
            state.membershipStatus = null;
            state.dataScope = "ASSIGNED_ONLY";
            state.shiftStatus = "OFFLINE";
            state.maxDiscountPercent = 0;
            state.unmaskPhoneHourlyLimit = 0;
            state.permissions = [];
            state.allowedChannelIds = [];
            state.allowedWarehouseIds = [];
            state.savedPageGroupPresets = [];
          }
        });
      } finally {
        set((state) => {
          state.isLoadingOverview = false;
        });
      }
    },

    applyRealtimeEffectiveContext: (ctx) => {
      set((state) => {
        if (
          state.activeShopId &&
          state.activeShopId !== ctx.shopId &&
          state.onboardingState === "HAS_ACTIVE_SHOPS"
        ) {
          return;
        }
        state.activeShopId = ctx.shopId;
        state.role = ctx.role;
        state.membershipStatus = ctx.membershipStatus;
        state.dataScope = ctx.dataScope;
        state.shiftStatus = ctx.shiftStatus;
        state.maxDiscountPercent = ctx.maxDiscountPercent;
        state.unmaskPhoneHourlyLimit = ctx.unmaskPhoneHourlyLimit;
        state.permissions =
          ctx.membershipStatus === "ACTIVE" ? ctx.permissions || [] : [];
        state.allowedChannelIds = ctx.allowedChannelIds || [];
        state.allowedWarehouseIds = ctx.allowedWarehouseIds || [];
        state.savedPageGroupPresets = ctx.savedPageGroupPresets || [];
        if (ctx.membershipStatus === "ACTIVE") {
          state.onboardingState = "HAS_ACTIVE_SHOPS";
        }
      });
      if (typeof window !== "undefined" && ctx.shopId) {
        localStorage.setItem("activeShopId", ctx.shopId);
      }
    },

    triggerMembersRefresh: () => {
      set((state) => {
        state.membersRefreshTick = (state.membersRefreshTick || 0) + 1;
      });
    },

    createShopAsOwner: async (payload) => {
      const res: any = await createShopAsOwnerApi(payload);
      const effectiveContext = res?.data?.effectiveContext;
      if (effectiveContext) {
        get().applyRealtimeEffectiveContext(effectiveContext);
      }
      await get().fetchOnboardingOverview();
      get().triggerMembersRefresh();
      return true;
    },

    requestJoinByCode: async (payload) => {
      await joinShopByCodeApi(payload);
      await get().fetchOnboardingOverview();
      return true;
    },

    acceptInvitation: async (idOrToken) => {
      const res: any = await acceptRoleInvitationApi(idOrToken);
      const effectiveContext = res?.data?.effectiveContext;
      if (effectiveContext) {
        get().applyRealtimeEffectiveContext(effectiveContext);
      }
      await get().fetchOnboardingOverview();
      get().triggerMembersRefresh();
      return true;
    },

    switchShopWorkspace: async (shopId) => {
      const res: any = await switchActiveShopApi(shopId);
      if (res?.data) {
        get().applyRealtimeEffectiveContext(res.data);
      }
      await get().fetchOnboardingOverview();
      get().triggerMembersRefresh();
      return true;
    },

    switchShiftStatus: async (targetStatus, handoverOptions) => {
      const { activeShopId } = get();
      if (!activeShopId) return false;

      set((state) => {
        state.isSwitchingShift = true;
      });

      try {
        const res: any = await updateShiftStatusApi(activeShopId, {
          targetStatus,
          ...handoverOptions,
        });
        const nextStatus: ShiftStatusType =
          res?.data?.shiftStatus || targetStatus;
        const reassignedCount = Number(
          res?.data?.reassignedConversationCount || 0,
        );

        set((state) => {
          state.shiftStatus = nextStatus;
          state.isHandoverModalOpen = false;
          state.pendingHandoverCount = 0;
          state.memberships = state.memberships.map((m) =>
            m.shopId === activeShopId ? { ...m, shiftStatus: nextStatus } : m,
          );
        });

        if (handoverOptions && reassignedCount > 0) {
          showSuccessToast(
            tStore("ShiftAndIam.handoverModal.handoverSuccessToast", {
              count: reassignedCount,
            }),
            {
              title: tStore(`ShiftAndIam.status.${nextStatus}`),
            },
          );
        }

        return true;
      } catch (err: any) {
        const errData = err?.response?.data;
        if (errData?.code === "SHIFT_HANDOVER_REQUIRED") {
          set((state) => {
            state.pendingHandoverCount = Number(
              errData.pendingConversationCount || 1,
            );
            state.isHandoverModalOpen = true;
          });
          return false;
        }
        showErrorToast(errData?.message || "Failed", {
          title: tStore(`ShiftAndIam.status.${targetStatus}`),
        });
        return false;
      } finally {
        set((state) => {
          state.isSwitchingShift = false;
        });
      }
    },

    closeHandoverModal: () => {
      set((state) => {
        state.isHandoverModalOpen = false;
      });
    },

    savePageGroupPresets: async (presets) => {
      const { activeShopId } = get();
      if (!activeShopId) return false;
      const res: any = await savePageGroupPresetsApi(activeShopId, presets);
      if (res?.data) {
        get().applyRealtimeEffectiveContext(res.data);
      } else {
        set((state) => {
          state.savedPageGroupPresets = presets;
        });
      }
      return true;
    },

    hasPermission: (code) => {
      const state = get();
      if (state.membershipStatus !== "ACTIVE") return false;
      if (state.role === "SHOP_OWNER") return true;
      if (Array.isArray(code)) {
        return code.every((c) => state.permissions.includes(c));
      }
      return state.permissions.includes(code);
    },

    resetPermissionState: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeShopId");
        localStorage.removeItem("seller-os-permission-storage");
      }
      set((state) => {
        state.onboardingState = "UNBOUND_USER";
        state.activeShopId = null;
        state.role = null;
        state.membershipStatus = null;
        state.permissions = [];
        state.savedPageGroupPresets = [];
        state.memberships = [];
        state.pendingInvitations = [];
        state.pendingHandoverCount = 0;
        state.isHandoverModalOpen = false;
        state.membersRefreshTick = 0;
      });
    },
  }),
  "seller-os-permission-storage",
);
