import { createPersistedStore } from "@/lib/stores/create-persisted-store";
import {
  acceptRoleInvitationApi,
  createShopAsOwnerApi,
  type DataScopeType,
  getOnboardingOverviewApi,
  joinShopByCodeApi,
  type MembershipStatusType,
  type ShiftStatusType,
  type ShopRoleType,
  switchActiveShopApi,
} from "./api";

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
  memberships: ShopMembershipSummary[];
  pendingInvitations: PendingInvitationSummary[];
  isLoadingOverview: boolean;
  membersRefreshTick: number;

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
    memberships: [],
    pendingInvitations: [],
    isLoadingOverview: false,
    membersRefreshTick: 0,

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
          } else {
            // Trạng thái ban đầu chưa gắn quán hoặc đang chờ phê duyệt -> Quyền trống 100%
            state.role = null;
            state.membershipStatus = null;
            state.dataScope = "ASSIGNED_ONLY";
            state.shiftStatus = "OFFLINE";
            state.maxDiscountPercent = 0;
            state.unmaskPhoneHourlyLimit = 0;
            state.permissions = [];
            state.allowedChannelIds = [];
            state.allowedWarehouseIds = [];
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
        state.memberships = [];
        state.pendingInvitations = [];
        state.membersRefreshTick = 0;
      });
    },
  }),
  "seller-os-permission-storage",
);
