import apiClient from "@/lib/http/axios-client";

export type ShopRoleType =
  | "SHOP_OWNER"
  | "SHOP_MANAGER"
  | "SENIOR_SALE"
  | "SALE_AGENT"
  | "WAREHOUSE_PACKER"
  | "ACCOUNTANT"
  | "MARKETING_AI_OPS";

export type MembershipStatusType =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED";

export type DataScopeType =
  | "ALL_SHOP"
  | "TEAM_SHIFT"
  | "ASSIGNED_PLUS_POOL"
  | "ASSIGNED_ONLY";

export type ShiftStatusType = "ONLINE" | "BUSY" | "OFFLINE";

export type RoutingStrategyType =
  | "STICKY_AGENT"
  | "LEAST_BUSY"
  | "ROUND_ROBIN"
  | "AI_FIRST";

export interface SavedPageGroupPresetItem {
  presetId: string;
  name: string;
  channelIntegrationIds: string[];
  isDefault?: boolean;
}

export const getOnboardingOverviewApi = async () => {
  return apiClient.get("/onboarding/overview");
};

export const verifyInviteTokenPublicApi = async (token: string) => {
  return apiClient.get("/onboarding/invitations/verify", {
    params: { token },
  });
};

export const getRolePresetsApi = async () => {
  return apiClient.get("/onboarding/role-presets");
};

export const createShopAsOwnerApi = async (data: {
  shopName: string;
  contactPhone?: string;
  defaultAddressLine?: string;
}) => {
  return apiClient.post("/onboarding/shops", data);
};

export const joinShopByCodeApi = async (data: {
  joinCode: string;
  requestedNote?: string;
}) => {
  return apiClient.post("/onboarding/join-by-code", data);
};

export const acceptRoleInvitationApi = async (idOrToken: string) => {
  return apiClient.post(`/onboarding/invitations/${idOrToken}/accept`);
};

export const switchActiveShopApi = async (shopId: string) => {
  return apiClient.post(`/onboarding/switch-shop/${shopId}`);
};

export const getMyShopContextApi = async (shopId: string) => {
  return apiClient.get(`/iam/shops/${shopId}/me-context`);
};

export const updateShiftStatusApi = async (
  shopId: string,
  data: {
    targetStatus: ShiftStatusType;
    handoverMode?: "AUTO_REDISTRIBUTE" | "TRANSFER_TO_AGENT" | "KEEP_ASSIGNED";
    targetHandoverAgentId?: string;
  },
) => {
  return apiClient.patch(`/iam/shops/${shopId}/shift-status`, data);
};

export const forceMemberOfflineApi = async (
  shopId: string,
  userId: string,
  data?: {
    handoverMode?: "AUTO_REDISTRIBUTE" | "TRANSFER_TO_AGENT" | "KEEP_ASSIGNED";
    targetHandoverAgentId?: string;
  },
) => {
  return apiClient.post(
    `/iam/shops/${shopId}/members/${userId}/force-offline`,
    data || { handoverMode: "AUTO_REDISTRIBUTE" },
  );
};

export const savePageGroupPresetsApi = async (
  shopId: string,
  presets: SavedPageGroupPresetItem[],
) => {
  return apiClient.patch(`/iam/shops/${shopId}/page-group-presets`, {
    presets,
  });
};

export const getWorkspaceSettingsApi = async (shopId: string) => {
  return apiClient.get(`/iam/shops/${shopId}/workspace-settings`);
};

export const updateWorkspaceSettingsApi = async (
  shopId: string,
  data: {
    slaResponseSeconds?: number;
    ghostedAlertSeconds?: number;
    autoReclaimMinutes?: number;
    routingStrategy?: RoutingStrategyType;
    lockOrderAfterPrint?: boolean;
    requireDepositOnHighRisk?: boolean;
    leadCollectorWeight?: number;
    orderCloserWeight?: number;
    deductOnReturnedOrder?: boolean;
    autoReserveStockOnMarketplaceOrder?: boolean;
    safetyBufferStockQty?: number;
    pushAvailableStockToShopeeTikTok?: boolean;
  },
) => {
  return apiClient.patch(`/iam/shops/${shopId}/workspace-settings`, data);
};

export const getShopMembersAndInvitationsApi = async (shopId: string) => {
  return apiClient.get(`/iam/shops/${shopId}/members`);
};

export const createRoleInvitationApi = async (
  shopId: string,
  data: {
    invitedEmail: string;
    invitedName?: string;
    targetRole: ShopRoleType;
    targetDataScope?: DataScopeType;
    maxDiscountPercent?: number;
    unmaskPhoneHourlyLimit?: number;
    customGrantedPermissions?: string[];
  },
) => {
  return apiClient.post(`/iam/shops/${shopId}/invitations`, data);
};

export const revokeRoleInvitationApi = async (
  shopId: string,
  invitationId: string,
) => {
  return apiClient.patch(
    `/iam/shops/${shopId}/invitations/${invitationId}/revoke`,
  );
};

export const approvePendingMemberApi = async (
  shopId: string,
  memberId: string,
  data: {
    assignedRole: ShopRoleType;
    assignedDataScope?: DataScopeType;
    maxDiscountPercent?: number;
    unmaskPhoneHourlyLimit?: number;
  },
) => {
  return apiClient.post(
    `/iam/shops/${shopId}/members/${memberId}/approve`,
    data,
  );
};

export const rejectPendingMemberApi = async (
  shopId: string,
  memberId: string,
  reason?: string,
) => {
  return apiClient.post(`/iam/shops/${shopId}/members/${memberId}/reject`, {
    reason,
  });
};

export const regenerateShopJoinCodeApi = async (shopId: string) => {
  return apiClient.post(`/iam/shops/${shopId}/regenerate-join-code`);
};

export const updateMemberPermissionsApi = async (
  shopId: string,
  memberId: string,
  data: {
    role: ShopRoleType;
    dataScope: DataScopeType;
    maxDiscountPercent: number;
    unmaskPhoneHourlyLimit: number;
    grantedPermissionsJson?: string[];
    revokedPermissionsJson?: string[];
    allowedChannelIdsJson?: string[];
    allowedWarehouseIdsJson?: string[];
  },
) => {
  return apiClient.patch(
    `/iam/shops/${shopId}/members/${memberId}/permissions`,
    data,
  );
};

export const updateMemberStatusApi = async (
  shopId: string,
  memberId: string,
  membershipStatus: MembershipStatusType,
) => {
  return apiClient.patch(`/iam/shops/${shopId}/members/${memberId}/status`, {
    membershipStatus,
  });
};

export const transferShopOwnershipApi = async (
  shopId: string,
  targetMemberId: string,
) => {
  return apiClient.post(`/iam/shops/${shopId}/transfer-ownership`, {
    targetMemberId,
  });
};
