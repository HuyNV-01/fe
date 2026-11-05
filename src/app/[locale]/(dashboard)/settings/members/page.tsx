/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Copy,
  Shield,
  Ban,
  Clock,
  Mail,
  User,
  Layers,
  RefreshCw,
  XCircle,
  Sliders,
  Crown,
  Percent,
  PhoneCall,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LiquidGlassInput,
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  GlassModal,
  GlassEmptyState,
  PatternButton,
  TriggerSelect,
  ContentSelect,
  ItemSelect,
} from "@/components/toolkit";
import { EMPTY_STRING } from "@/constant";
import { MESSAGES } from "@/constant/messages";
import {
  approvePendingMemberApi,
  createRoleInvitationApi,
  type DataScopeType,
  getRolePresetsApi,
  getShopMembersAndInvitationsApi,
  regenerateShopJoinCodeApi,
  rejectPendingMemberApi,
  revokeRoleInvitationApi,
  type ShopRoleType,
  transferShopOwnershipApi,
  updateMemberPermissionsApi,
  updateMemberStatusApi,
} from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/utils/toast";
import { cn } from "@/lib/utils";

type MembersTabMode = "ACTIVE_MEMBERS" | "PENDING_APPROVAL" | "INVITATIONS";
type ActiveModalMode =
  | "INVITE"
  | "APPROVE"
  | "CUSTOMIZE_PERMISSIONS"
  | "TRANSFER_OWNERSHIP"
  | null;

const ASSIGNABLE_ROLES: ShopRoleType[] = [
  "SHOP_MANAGER",
  "SENIOR_SALE",
  "SALE_AGENT",
  "WAREHOUSE_PACKER",
  "ACCOUNTANT",
  "MARKETING_AI_OPS",
];

const DATA_SCOPES: DataScopeType[] = [
  "ALL_SHOP",
  "TEAM_SHIFT",
  "ASSIGNED_PLUS_POOL",
  "ASSIGNED_ONLY",
];

const PERMISSION_GROUPS: Array<{
  groupKey: string;
  codes: string[];
}> = [
  {
    groupKey: "IAM_AND_CHANNEL",
    codes: [
      "CHANNEL_INTEGRATION_CONNECT",
      "CHANNEL_WEBHOOK_INSPECT_REPLAY",
      "IAM_MEMBER_INVITE_MANAGE",
      "IAM_ROLE_MATRIX_EDIT",
      "IAM_SECURITY_AUDIT_LOG_VIEW",
      "IAM_SHIFT_FORCE_HANDOVER",
    ],
  },
  {
    groupKey: "INBOX_AND_TAG",
    codes: [
      "INBOX_MULTI_PAGE_MERGE",
      "INBOX_ROUTING_RULES_CONFIGURE",
      "INBOX_COLLISION_FORCE_TAKEOVER",
      "INBOX_CONVERSATION_VIEW",
      "INBOX_CONVERSATION_REPLY",
      "INBOX_INTERNAL_NOTE_WRITE",
      "INBOX_CONVERSATION_TRANSFER",
      "INBOX_CONVERSATION_SNOOZE",
      "INBOX_VOIP_CALL_MASKED",
      "TAG_SCHEMA_CREATE_EDIT",
      "TAG_CONVERSATION_ASSIGN",
      "TAG_MESSAGE_BOOKMARK_ASSIGN",
    ],
  },
  {
    groupKey: "CRM_AND_POS",
    codes: [
      "CRM_CUSTOMER_PROFILE_VIEW",
      "CRM_CUSTOMER_PROFILE_EDIT",
      "CRM_PHONE_UNMASK",
      "CRM_TRUST_SCORE_VIEW",
      "POS_DRAFT_CART_CREATE",
      "POS_ORDER_CONFIRM_SUBMIT",
      "POS_COUNTER_CHECKOUT",
      "POS_DISCOUNT_WITHIN_LIMIT",
      "POS_DISCOUNT_APPROVE_OVERRIDE",
      "POS_VIETQR_MANUAL_VERIFY",
    ],
  },
  {
    groupKey: "WAREHOUSE_OMS_FINANCE",
    codes: [
      "CATALOG_PRODUCT_VIEW",
      "CATALOG_PRODUCT_CREATE_EDIT",
      "CATALOG_COST_PRICE_VIEW",
      "CATALOG_COST_PRICE_EDIT",
      "WAREHOUSE_STOCK_VIEW",
      "WAREHOUSE_STOCKTAKE_ADJUST",
      "OMS_ORDER_LIST_VIEW",
      "OMS_BARCODE_PACK_VERIFY",
      "OMS_SHIPPING_LABEL_PRINT",
      "OMS_COD_RECONCILIATION_EXECUTE",
      "FINANCE_CASHBOOK_MANAGE",
      "FINANCE_PNL_STATEMENT_VIEW",
    ],
  },
];

const inviteMemberSchema = z.object({
  invitedEmail: z
    .string()
    .trim()
    .min(1, MESSAGES.ZOD.AUTH.LOGIN.EMAIL.REQUIRED)
    .email(MESSAGES.ZOD.AUTH.LOGIN.EMAIL.INVALID),
  invitedName: z.string().trim(),
  targetRole: z.enum([
    "SHOP_MANAGER",
    "SENIOR_SALE",
    "SALE_AGENT",
    "WAREHOUSE_PACKER",
    "ACCOUNTANT",
    "MARKETING_AI_OPS",
  ]),
  targetDataScope: z.enum([
    "ALL_SHOP",
    "TEAM_SHIFT",
    "ASSIGNED_PLUS_POOL",
    "ASSIGNED_ONLY",
  ]),
});

const approveMemberSchema = z.object({
  assignedRole: z.enum([
    "SHOP_MANAGER",
    "SENIOR_SALE",
    "SALE_AGENT",
    "WAREHOUSE_PACKER",
    "ACCOUNTANT",
    "MARKETING_AI_OPS",
  ]),
  assignedDataScope: z.enum([
    "ALL_SHOP",
    "TEAM_SHIFT",
    "ASSIGNED_PLUS_POOL",
    "ASSIGNED_ONLY",
  ]),
});

const customizePermissionsSchema = z.object({
  role: z.enum([
    "SHOP_MANAGER",
    "SENIOR_SALE",
    "SALE_AGENT",
    "WAREHOUSE_PACKER",
    "ACCOUNTANT",
    "MARKETING_AI_OPS",
  ]),
  dataScope: z.enum([
    "ALL_SHOP",
    "TEAM_SHIFT",
    "ASSIGNED_PLUS_POOL",
    "ASSIGNED_ONLY",
  ]),
  maxDiscountPercent: z.number().min(0).max(100),
  unmaskPhoneHourlyLimit: z.number().min(0).max(999999),
});

const transferOwnershipSchema = z.object({
  targetMemberId: z.string().trim().min(1),
});

function resolveRolePresetDefaults(selectedRole: ShopRoleType): {
  defaultScope: DataScopeType;
  defaultDiscount: number;
  defaultUnmask: number;
} {
  let defaultScope: DataScopeType = "ASSIGNED_PLUS_POOL";
  let defaultDiscount = 5;
  let defaultUnmask = 15;

  if (
    selectedRole === "SHOP_MANAGER" ||
    selectedRole === "WAREHOUSE_PACKER" ||
    selectedRole === "ACCOUNTANT" ||
    selectedRole === "MARKETING_AI_OPS"
  ) {
    defaultScope = "ALL_SHOP";
  } else if (selectedRole === "SENIOR_SALE") {
    defaultScope = "TEAM_SHIFT";
  }

  if (selectedRole === "SHOP_MANAGER") {
    defaultDiscount = 30;
    defaultUnmask = 100;
  } else if (selectedRole === "SENIOR_SALE") {
    defaultDiscount = 15;
    defaultUnmask = 30;
  } else if (
    selectedRole === "WAREHOUSE_PACKER" ||
    selectedRole === "ACCOUNTANT"
  ) {
    defaultDiscount = 0;
    defaultUnmask = selectedRole === "ACCOUNTANT" ? 20 : 0;
  }

  return { defaultScope, defaultDiscount, defaultUnmask };
}

export default function ShopMembersManagementPage() {
  const t = useTranslations("OnboardingAndRoles");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as MembersTabMode | null;

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const myRole = usePermissionStore((s) => s.role);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);

  const [activeTab, setActiveTab] = useState<MembersTabMode>("ACTIVE_MEMBERS");
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [rolePresets, setRolePresets] = useState<Record<string, any>>({});

  // Chỉ cho phép mở tối đa 1 Modal Form tại 1 thời điểm
  const [activeModalMode, setActiveModalMode] = useState<ActiveModalMode>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [customGrantedPerms, setCustomGrantedPerms] = useState<string[]>([]);

  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);

  const loadMembersData = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const [membersRes, presetsRes]: [any, any] = await Promise.all([
        getShopMembersAndInvitationsApi(activeShopId),
        getRolePresetsApi(),
      ]);
      setShopInfo(membersRes?.data?.shop || null);
      setMembers(membersRes?.data?.members || []);
      setInvitations(membersRes?.data?.invitations || []);
      if (presetsRes?.data) {
        setRolePresets(presetsRes.data);
      }
    } catch {}
  }, [activeShopId]);

  // Tự động tải lại dữ liệu khi có sự kiện Socket Real-Time (membersRefreshTick tăng) mà không cần F5
  useEffect(() => {
    loadMembersData();
  }, [loadMembersData, membersRefreshTick]);

  // Hỗ trợ điều hướng trực tiếp từ NotificationBell qua ?tab=PENDING_APPROVAL hoặc ?tab=ACTIVE_MEMBERS
  useEffect(() => {
    if (
      tabParam === "ACTIVE_MEMBERS" ||
      tabParam === "PENDING_APPROVAL" ||
      tabParam === "INVITATIONS"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // FORM 1: MỜI NHÂN VIÊN / KẾ TOÁN / KHO QUA EMAIL (TANSTACK FORM + SHADCN FIELD)
  const inviteForm = useForm({
    defaultValues: {
      invitedEmail: EMPTY_STRING,
      invitedName: EMPTY_STRING,
      targetRole: "SALE_AGENT" as ShopRoleType,
      targetDataScope: "ASSIGNED_PLUS_POOL" as DataScopeType,
    },
    validators: {
      onChange: inviteMemberSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeShopId) return;
      setIsSubmittingInvite(true);
      const { defaultDiscount, defaultUnmask } = resolveRolePresetDefaults(
        value.targetRole,
      );
      try {
        await createRoleInvitationApi(activeShopId, {
          invitedEmail: value.invitedEmail.trim(),
          invitedName: value.invitedName.trim() || undefined,
          targetRole: value.targetRole,
          targetDataScope: value.targetDataScope,
          maxDiscountPercent: defaultDiscount,
          unmaskPhoneHourlyLimit: defaultUnmask,
        });
        setActiveModalMode(null);
        inviteForm.reset();
        await loadMembersData();
        showSuccessToast(
          t("membersPage.inviteSentToastDesc", {
            email: value.invitedEmail.trim(),
            role: t(`roles.${value.targetRole}`),
          }),
          {
            title: t("membersPage.inviteSentToastTitle"),
          },
        );
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Failed", {
          title: t("membersPage.inviteBtn"),
        });
      } finally {
        setIsSubmittingInvite(false);
      }
    },
  });

  // FORM 2: PHÊ DUYỆT NHÂN VIÊN ĐANG CHỜ DUYỆT (TANSTACK FORM + SHADCN FIELD)
  const approveForm = useForm({
    defaultValues: {
      assignedRole: "SALE_AGENT" as ShopRoleType,
      assignedDataScope: "ASSIGNED_PLUS_POOL" as DataScopeType,
    },
    validators: {
      onChange: approveMemberSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeShopId || !selectedMember) return;
      setIsApproving(true);
      const { defaultDiscount, defaultUnmask } = resolveRolePresetDefaults(
        value.assignedRole,
      );
      try {
        await approvePendingMemberApi(activeShopId, selectedMember.id, {
          assignedRole: value.assignedRole,
          assignedDataScope: value.assignedDataScope,
          maxDiscountPercent: defaultDiscount,
          unmaskPhoneHourlyLimit: defaultUnmask,
        });
        setSelectedMember(null);
        setActiveModalMode(null);
        approveForm.reset();
        await loadMembersData();
        showSuccessToast(t("membersPage.approvedToastDesc"), {
          title: t("membersPage.approvedToastTitle"),
        });
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Failed", {
          title: t("membersPage.approveModalTitle"),
        });
      } finally {
        setIsApproving(false);
      }
    },
  });

  // FORM 3: TINH CHỈNH CHI TIẾT VAI TRÒ, HẠN MỨC & 92 MÃ QUYỀN (F00.5)
  const customizePermissionsForm = useForm({
    defaultValues: {
      role: "SALE_AGENT" as ShopRoleType,
      dataScope: "ASSIGNED_PLUS_POOL" as DataScopeType,
      maxDiscountPercent: 5,
      unmaskPhoneHourlyLimit: 15,
    },
    validators: {
      onChange: customizePermissionsSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeShopId || !selectedMember) return;
      setIsSavingPermissions(true);
      try {
        await updateMemberPermissionsApi(activeShopId, selectedMember.id, {
          role: value.role,
          dataScope: value.dataScope,
          maxDiscountPercent: Number(value.maxDiscountPercent),
          unmaskPhoneHourlyLimit: Number(value.unmaskPhoneHourlyLimit),
          grantedPermissionsJson: customGrantedPerms,
          revokedPermissionsJson: [],
        });
        setSelectedMember(null);
        setActiveModalMode(null);
        await loadMembersData();
        showSuccessToast(
          `${selectedMember.user?.name || selectedMember.user?.email} -> ${t(`roles.${value.role}`)}`,
          {
            title: t("membersPage.roleUpdatedToast"),
          },
        );
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Failed");
      } finally {
        setIsSavingPermissions(false);
      }
    },
  });

  // FORM 4: CHUYỂN NHƯỢNG QUYỀN CHỦ CỬA HÀNG SHOP_OWNER (F00.6)
  const transferOwnershipForm = useForm({
    defaultValues: {
      targetMemberId: EMPTY_STRING,
    },
    validators: {
      onChange: transferOwnershipSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeShopId || !value.targetMemberId) return;
      setIsTransferringOwnership(true);
      try {
        await transferShopOwnershipApi(activeShopId, value.targetMemberId);
        setActiveModalMode(null);
        transferOwnershipForm.reset();
        await loadMembersData();
        showSuccessToast(t("membersPage.transferOwnershipSuccessDesc"), {
          title: t("membersPage.transferOwnershipSuccessTitle"),
        });
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Failed");
      } finally {
        setIsTransferringOwnership(false);
      }
    },
  });

  const handleOpenCustomizePermissions = (member: any) => {
    setSelectedMember(member);
    customizePermissionsForm.setFieldValue("role", member.role);
    customizePermissionsForm.setFieldValue("dataScope", member.dataScope);
    customizePermissionsForm.setFieldValue(
      "maxDiscountPercent",
      Number(member.maxDiscountPercent || 0),
    );
    customizePermissionsForm.setFieldValue(
      "unmaskPhoneHourlyLimit",
      Number(member.unmaskPhoneHourlyLimit || 0),
    );

    const existingPerms: string[] =
      member.grantedPermissionsJson?.length > 0
        ? member.grantedPermissionsJson
        : rolePresets[member.role]?.defaultPermissions || [];
    setCustomGrantedPerms(existingPerms);
    setActiveModalMode("CUSTOMIZE_PERMISSIONS");
  };

  const handleTogglePermissionCode = (code: string, checked: boolean) => {
    setCustomGrantedPerms((prev) =>
      checked ? Array.from(new Set([...prev, code])) : prev.filter((c) => c !== code),
    );
  };

  const handleQuickRoleUpdate = async (
    member: any,
    nextRole: ShopRoleType,
  ) => {
    if (!activeShopId) return;
    const { defaultScope, defaultDiscount, defaultUnmask } =
      resolveRolePresetDefaults(nextRole);
    try {
      await updateMemberPermissionsApi(activeShopId, member.id, {
        role: nextRole,
        dataScope: defaultScope,
        maxDiscountPercent: defaultDiscount,
        unmaskPhoneHourlyLimit: defaultUnmask,
      });
      await loadMembersData();
      showSuccessToast(
        `${member.user?.name || member.user?.email} -> ${t(`roles.${nextRole}`)}`,
        {
          title: t("membersPage.roleUpdatedToast"),
        },
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    }
  };

  const handleToggleSuspend = async (member: any) => {
    if (!activeShopId) return;
    const nextStatus =
      member.membershipStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateMemberStatusApi(activeShopId, member.id, nextStatus);
      await loadMembersData();
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    }
  };

  const handleRejectPendingMember = async (member: any) => {
    if (!activeShopId) return;
    setIsRejectingId(member.id);
    try {
      await rejectPendingMemberApi(activeShopId, member.id);
      await loadMembersData();
      showInfoToast(t("membersPage.rejectedToastDesc"), {
        title: t("membersPage.rejectedToastTitle"),
      });
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsRejectingId(null);
    }
  };

  const handleRevokeInvitation = async (inv: any) => {
    if (!activeShopId) return;
    setIsRevokingId(inv.id);
    try {
      await revokeRoleInvitationApi(activeShopId, inv.id);
      await loadMembersData();
      showInfoToast(t("membersPage.revokedInviteToastDesc"), {
        title: t("membersPage.revokedInviteToastTitle"),
      });
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsRevokingId(null);
    }
  };

  const handleRegenerateJoinCode = async () => {
    if (!activeShopId) return;
    setIsRegeneratingCode(true);
    try {
      const res: any = await regenerateShopJoinCodeApi(activeShopId);
      const nextCode = res?.data?.joinCode;
      await loadMembersData();
      if (nextCode) {
        showSuccessToast(nextCode, {
          title: t("membersPage.regeneratedJoinCodeTitle"),
        });
      }
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const activeMembers = members.filter(
    (m) => m.membershipStatus !== "PENDING_APPROVAL",
  );
  const pendingMembers = members.filter(
    (m) => m.membershipStatus === "PENDING_APPROVAL",
  );
  const eligibleTransferMembers = activeMembers.filter(
    (m) => m.role !== "SHOP_OWNER" && m.membershipStatus === "ACTIVE",
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <GlassSectionHeader
        icon={<Users className="w-5 h-5" />}
        title={t("membersPage.title")}
        subtitle={t("membersPage.subtitle")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {shopInfo?.joinCode && (
              <>
                <PatternButton
                  type="button"
                  variant="glass"
                  size="sm"
                  rounded="full"
                  onClick={() => {
                    navigator.clipboard.writeText(shopInfo.joinCode);
                    showInfoToast(shopInfo.joinCode, {
                      title: t("membersPage.copiedJoinCode"),
                    });
                  }}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  {t("membersPage.shopJoinCodeLabel", {
                    code: shopInfo.joinCode,
                  })}
                </PatternButton>

                <PatternButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  isLoading={isRegeneratingCode}
                  onClick={handleRegenerateJoinCode}
                  title={t("membersPage.regenerateJoinCodeBtn")}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  {t("membersPage.regenerateJoinCodeBtn")}
                </PatternButton>
              </>
            )}

            {myRole === "SHOP_OWNER" && eligibleTransferMembers.length > 0 && (
              <PatternButton
                type="button"
                variant="glass"
                color="warning"
                size="sm"
                rounded="full"
                onClick={() => {
                  setSelectedMember(null);
                  transferOwnershipForm.setFieldValue(
                    "targetMemberId",
                    eligibleTransferMembers[0]?.id || EMPTY_STRING,
                  );
                  setActiveModalMode("TRANSFER_OWNERSHIP");
                }}
                icon={<Crown className="w-3.5 h-3.5" />}
              >
                {t("membersPage.transferOwnershipBtn")}
              </PatternButton>
            )}

            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              onClick={() => {
                setSelectedMember(null);
                inviteForm.reset();
                setActiveModalMode("INVITE");
              }}
              icon={<UserPlus className="w-4 h-4" />}
            >
              {t("membersPage.inviteBtn")}
            </PatternButton>
          </div>
        }
      />

      <GlassTabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            key: "ACTIVE_MEMBERS",
            label: t("membersPage.tabs.activeMembers"),
            badge: activeMembers.length,
          },
          {
            key: "PENDING_APPROVAL",
            label: t("membersPage.tabs.pendingApproval"),
            badge: pendingMembers.length,
          },
          {
            key: "INVITATIONS",
            label: t("membersPage.tabs.invitations"),
            badge: invitations.length,
          },
        ]}
      />

      {activeTab === "ACTIVE_MEMBERS" && (
        <div className="space-y-3">
          {activeMembers.map((m) => {
            const isOwner = m.role === "SHOP_OWNER";
            const permCount = isOwner
              ? 92
              : (m.grantedPermissionsJson?.length ||
                  rolePresets[m.role]?.defaultPermissions?.length ||
                  0);
            return (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <GlassAvatar
                      name={m.user?.name || m.user?.email || "U"}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">
                          {m.user?.name || m.user?.email}
                        </span>
                        <GlassBadge
                          variant={isOwner ? "primary" : "accent"}
                          size="sm"
                        >
                          {t(`roles.${m.role}`)}
                        </GlassBadge>
                        <GlassBadge
                          variant={
                            m.membershipStatus === "ACTIVE"
                              ? "success"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {t(`status.${m.membershipStatus}`)}
                        </GlassBadge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.user?.email} • {t(`scopes.${m.dataScope}`)} •{" "}
                        {t("membersPage.maxDiscountShort", {
                          percent: m.maxDiscountPercent,
                        })}{" "}
                        •{" "}
                        {t("membersPage.permissionCountBadge", {
                          count: permCount,
                        })}
                      </p>
                    </div>
                  </div>

                  {!isOwner && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={m.role}
                        onValueChange={(val) =>
                          handleQuickRoleUpdate(m, val as ShopRoleType)
                        }
                      >
                        <TriggerSelect size="sm">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                            <SelectValue />
                          </div>
                        </TriggerSelect>

                        <ContentSelect align="end">
                          {ASSIGNABLE_ROLES.map((r) => (
                            <ItemSelect
                              key={r}
                              value={r}
                              icon={<Shield className="w-3.5 h-3.5" />}
                            >
                              <span>{t(`roles.${r}`)}</span>
                            </ItemSelect>
                          ))}
                        </ContentSelect>
                      </Select>

                      <PatternButton
                        type="button"
                        variant="glass"
                        size="sm"
                        rounded="full"
                        onClick={() => handleOpenCustomizePermissions(m)}
                        icon={<Sliders className="w-3.5 h-3.5" />}
                      >
                        {t("membersPage.customizePermissionsBtn")}
                      </PatternButton>

                      <PatternButton
                        type="button"
                        variant="ghost"
                        color={
                          m.membershipStatus === "ACTIVE" ? "danger" : "success"
                        }
                        size="sm"
                        rounded="full"
                        onClick={() => handleToggleSuspend(m)}
                        icon={<Ban className="w-3.5 h-3.5" />}
                      >
                        {m.membershipStatus === "ACTIVE"
                          ? t("membersPage.suspendBtn")
                          : t("membersPage.restoreBtn")}
                      </PatternButton>
                    </div>
                  )}
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      )}

      {activeTab === "PENDING_APPROVAL" && (
        <div className="space-y-3">
          {pendingMembers.length === 0 ? (
            <GlassEmptyState
              icon={<Clock className="w-6 h-6" />}
              title={t("membersPage.emptyPendingTitle")}
            />
          ) : (
            pendingMembers.map((m) => (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {m.user?.name || m.user?.email}
                      </span>
                      <GlassBadge variant="warning" size="sm" pulse dot>
                        {t("status.PENDING_APPROVAL")}
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {m.user?.email}
                    </p>
                    {m.requestedJoinNote && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        “{m.requestedJoinNote}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <PatternButton
                      type="button"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      rounded="full"
                      isLoading={isRejectingId === m.id}
                      onClick={() => handleRejectPendingMember(m)}
                      icon={<XCircle className="w-4 h-4" />}
                    >
                      {t("membersPage.rejectBtn")}
                    </PatternButton>

                    <PatternButton
                      type="button"
                      variant="solid"
                      color="primary"
                      size="sm"
                      rounded="full"
                      onClick={() => {
                        setSelectedMember(m);
                        approveForm.setFieldValue("assignedRole", "SALE_AGENT");
                        approveForm.setFieldValue(
                          "assignedDataScope",
                          "ASSIGNED_PLUS_POOL",
                        );
                        setActiveModalMode("APPROVE");
                      }}
                      icon={<Shield className="w-4 h-4" />}
                    >
                      {t("membersPage.approveAndAssignRoleBtn")}
                    </PatternButton>
                  </div>
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

      {activeTab === "INVITATIONS" && (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <GlassEmptyState
              icon={<Mail className="w-6 h-6" />}
              title={t("membersPage.emptyInvitationsTitle")}
            />
          ) : (
            invitations.map((inv) => (
              <GlassSurfaceCard key={inv.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        {inv.invitedEmail}
                      </span>
                      <GlassBadge variant="primary" size="sm">
                        {t(`roles.${inv.targetRole}`)}
                      </GlassBadge>
                      <GlassBadge
                        variant={
                          inv.status === "ACCEPTED"
                            ? "success"
                            : inv.status === "REVOKED"
                              ? "danger"
                              : "info"
                        }
                        size="sm"
                      >
                        {inv.status}
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(`scopes.${inv.targetDataScope}`)}
                    </p>
                  </div>

                  {inv.status === "PENDING" && (
                    <PatternButton
                      type="button"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      rounded="full"
                      isLoading={isRevokingId === inv.id}
                      onClick={() => handleRevokeInvitation(inv)}
                      icon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      {t("membersPage.revokeInviteBtn")}
                    </PatternButton>
                  )}
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: MỜI NHÂN VIÊN QUA EMAIL */}
      {activeModalMode === "INVITE" && (
        <GlassModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModalMode(null);
          }}
          title={t("membersPage.inviteModalTitle")}
          description={t("membersPage.inviteModalDesc")}
          size="md"
          footer={
            <PatternButton
              type="submit"
              form="invite-member-form"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              isLoading={isSubmittingInvite}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t("membersPage.sendInviteConfirmBtn")}
            </PatternButton>
          }
        >
          <form
            id="invite-member-form"
            onSubmit={(e) => {
              e.preventDefault();
              inviteForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup>
                  <inviteForm.Field name="invitedEmail">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("membersPage.emailPlaceholder")}
                            <span className="ml-0.5 text-red-400">*</span>
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <Mail className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                type="email"
                                placeholder={t("membersPage.emailPlaceholder")}
                                className={cn(
                                  "flex h-full w-full py-2 text-sm",
                                  "bg-transparent!",
                                  "border-none",
                                  "shadow-none",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                                  "px-0",
                                )}
                              />
                            </div>
                          </LiquidGlassInput>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </inviteForm.Field>

                  <inviteForm.Field name="invitedName">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("membersPage.namePlaceholder")}
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <User className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                type="text"
                                placeholder={t("membersPage.namePlaceholder")}
                                className={cn(
                                  "flex h-full w-full py-2 text-sm",
                                  "bg-transparent!",
                                  "border-none",
                                  "shadow-none",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                                  "px-0",
                                )}
                              />
                            </div>
                          </LiquidGlassInput>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </inviteForm.Field>

                  <inviteForm.Field name="targetRole">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectRoleLabel")}
                          <span className="ml-0.5 text-red-400">*</span>
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => {
                            const nextRole = val as ShopRoleType;
                            field.handleChange(nextRole);
                            const { defaultScope } =
                              resolveRolePresetDefaults(nextRole);
                            inviteForm.setFieldValue(
                              "targetDataScope",
                              defaultScope,
                            );
                          }}
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>

                          <ContentSelect>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <ItemSelect
                                key={r}
                                value={r}
                                icon={
                                  <Shield className="h-4 w-4 text-primary" />
                                }
                              >
                                <span>{t(`roles.${r}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </inviteForm.Field>

                  <inviteForm.Field name="targetDataScope">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectScopeLabel")}
                          <span className="ml-0.5 text-red-400">*</span>
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) =>
                            field.handleChange(val as DataScopeType)
                          }
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>

                          <ContentSelect>
                            {DATA_SCOPES.map((s) => (
                              <ItemSelect
                                key={s}
                                value={s}
                                icon={
                                  <Layers className="h-4 w-4 text-indigo-500" />
                                }
                              >
                                <span>{t(`scopes.${s}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </inviteForm.Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassModal>
      )}

      {/* MODAL 2: PHÊ DUYỆT YÊU CẦU XIN VÀO QUÁN */}
      {activeModalMode === "APPROVE" && selectedMember && (
        <GlassModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMember(null);
              setActiveModalMode(null);
            }
          }}
          title={t("membersPage.approveModalTitle")}
          description={selectedMember?.user?.email}
          size="md"
          footer={
            <PatternButton
              type="submit"
              form="approve-member-form"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              isLoading={isApproving}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t("membersPage.confirmApproveBtn")}
            </PatternButton>
          }
        >
          <form
            id="approve-member-form"
            onSubmit={(e) => {
              e.preventDefault();
              approveForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup>
                  <approveForm.Field name="assignedRole">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectRoleLabel")}
                          <span className="ml-0.5 text-red-400">*</span>
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => {
                            const nextRole = val as ShopRoleType;
                            field.handleChange(nextRole);
                            const { defaultScope } =
                              resolveRolePresetDefaults(nextRole);
                            approveForm.setFieldValue(
                              "assignedDataScope",
                              defaultScope,
                            );
                          }}
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>

                          <ContentSelect>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <ItemSelect
                                key={r}
                                value={r}
                                icon={
                                  <Shield className="h-4 w-4 text-primary" />
                                }
                              >
                                <span>{t(`roles.${r}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </approveForm.Field>

                  <approveForm.Field name="assignedDataScope">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectScopeLabel")}
                          <span className="ml-0.5 text-red-400">*</span>
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) =>
                            field.handleChange(val as DataScopeType)
                          }
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>

                          <ContentSelect>
                            {DATA_SCOPES.map((s) => (
                              <ItemSelect
                                key={s}
                                value={s}
                                icon={
                                  <Layers className="h-4 w-4 text-indigo-500" />
                                }
                              >
                                <span>{t(`scopes.${s}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </approveForm.Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassModal>
      )}

      {/* MODAL 3: TINH CHỈNH CHI TIẾT VAI TRÒ, HẠN MỨC & 92 MÃ QUYỀN (F00.5) */}
      {activeModalMode === "CUSTOMIZE_PERMISSIONS" && selectedMember && (
        <GlassModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMember(null);
              setActiveModalMode(null);
            }
          }}
          title={t("membersPage.customizeModalTitle")}
          description={selectedMember?.user?.email}
          size="lg"
          footer={
            <PatternButton
              type="submit"
              form="customize-permissions-form"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              isLoading={isSavingPermissions}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t("membersPage.savePermissionsBtn")}
            </PatternButton>
          }
        >
          <form
            id="customize-permissions-form"
            onSubmit={(e) => {
              e.preventDefault();
              customizePermissionsForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <customizePermissionsForm.Field name="role">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectRoleLabel")}
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => {
                            const nextRole = val as ShopRoleType;
                            field.handleChange(nextRole);
                            const {
                              defaultScope,
                              defaultDiscount,
                              defaultUnmask,
                            } = resolveRolePresetDefaults(nextRole);
                            customizePermissionsForm.setFieldValue(
                              "dataScope",
                              defaultScope,
                            );
                            customizePermissionsForm.setFieldValue(
                              "maxDiscountPercent",
                              defaultDiscount,
                            );
                            customizePermissionsForm.setFieldValue(
                              "unmaskPhoneHourlyLimit",
                              defaultUnmask,
                            );
                            if (rolePresets[nextRole]?.defaultPermissions) {
                              setCustomGrantedPerms(
                                rolePresets[nextRole].defaultPermissions,
                              );
                            }
                          }}
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>
                          <ContentSelect>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <ItemSelect key={r} value={r}>
                                <span>{t(`roles.${r}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </customizePermissionsForm.Field>

                  <customizePermissionsForm.Field name="dataScope">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t("membersPage.selectScopeLabel")}
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) =>
                            field.handleChange(val as DataScopeType)
                          }
                        >
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <SelectTrigger
                              id={field.name}
                              className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </LiquidGlassInput>
                          <ContentSelect>
                            {DATA_SCOPES.map((s) => (
                              <ItemSelect key={s} value={s}>
                                <span>{t(`scopes.${s}`)}</span>
                              </ItemSelect>
                            ))}
                          </ContentSelect>
                        </Select>
                      </Field>
                    )}
                  </customizePermissionsForm.Field>

                  <customizePermissionsForm.Field name="maxDiscountPercent">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("membersPage.maxDiscountLabel")}
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <Percent className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                              <Input
                                id={field.name}
                                name={field.name}
                                value={String(field.state.value)}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(
                                    Number(e.target.value || 0),
                                  )
                                }
                                type="number"
                                min={0}
                                max={100}
                                className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                              />
                            </div>
                          </LiquidGlassInput>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </customizePermissionsForm.Field>

                  <customizePermissionsForm.Field name="unmaskPhoneHourlyLimit">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("membersPage.unmaskLimitLabel")}
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <PhoneCall className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                              <Input
                                id={field.name}
                                name={field.name}
                                value={String(field.state.value)}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(
                                    Number(e.target.value || 0),
                                  )
                                }
                                type="number"
                                min={0}
                                className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                              />
                            </div>
                          </LiquidGlassInput>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </customizePermissionsForm.Field>
                </FieldGroup>

                <Field>
                  <FieldLabel>
                    {t("membersPage.granularPermissionsHeading", {
                      count: customGrantedPerms.length,
                    })}
                  </FieldLabel>
                  <ScrollArea className="h-56 rounded-xl border border-border/50 p-3">
                    <div className="space-y-4">
                      {PERMISSION_GROUPS.map((grp) => (
                        <div key={grp.groupKey} className="space-y-2">
                          <p className="text-xs font-bold text-primary">
                            {grp.groupKey}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grp.codes.map((code) => {
                              const isChecked =
                                customGrantedPerms.includes(code);
                              return (
                                <div
                                  key={code}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border/40 px-2.5 py-1.5"
                                >
                                  <span className="text-[11px] font-mono truncate">
                                    {code}
                                  </span>
                                  <Switch
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleTogglePermissionCode(code, checked)
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Field>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassModal>
      )}

      {/* MODAL 4: CHUYỂN NHƯỢNG QUYỀN CHỦ CỬA HÀNG (F00.6) */}
      {activeModalMode === "TRANSFER_OWNERSHIP" && (
        <GlassModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModalMode(null);
          }}
          title={t("membersPage.transferOwnershipModalTitle")}
          description={t("membersPage.transferOwnershipModalDesc")}
          size="md"
          footer={
            <PatternButton
              type="submit"
              form="transfer-ownership-form"
              variant="solid"
              color="warning"
              size="sm"
              rounded="full"
              isLoading={isTransferringOwnership}
              icon={<Crown className="w-4 h-4" />}
            >
              {t("membersPage.confirmTransferOwnershipBtn")}
            </PatternButton>
          }
        >
          <form
            id="transfer-ownership-form"
            onSubmit={(e) => {
              e.preventDefault();
              transferOwnershipForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldDescription className="text-xs leading-relaxed">
                  {t("membersPage.transferOwnershipWarning")}
                </FieldDescription>

                <transferOwnershipForm.Field name="targetMemberId">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("membersPage.selectNewOwnerLabel")}
                        <span className="ml-0.5 text-red-400">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => field.handleChange(val)}
                      >
                        <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                          <SelectTrigger
                            id={field.name}
                            className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5"
                          >
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                        </LiquidGlassInput>

                        <ContentSelect>
                          {eligibleTransferMembers.map((m) => (
                            <ItemSelect key={m.id} value={m.id}>
                              <span>
                                {m.user?.name || m.user?.email} (
                                {t(`roles.${m.role}`)})
                              </span>
                            </ItemSelect>
                          ))}
                        </ContentSelect>
                      </Select>
                    </Field>
                  )}
                </transferOwnershipForm.Field>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassModal>
      )}
    </div>
  );
}
