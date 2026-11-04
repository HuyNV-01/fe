/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Field,
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
  getShopMembersAndInvitationsApi,
  type ShopRoleType,
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
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const [activeTab, setActiveTab] = useState<
    "ACTIVE_MEMBERS" | "PENDING_APPROVAL" | "INVITATIONS"
  >("ACTIVE_MEMBERS");
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Chỉ cho phép mở tối đa 1 Modal Form tại 1 thời điểm (INVITE hoặc APPROVE)
  const [activeModalMode, setActiveModalMode] = useState<
    "INVITE" | "APPROVE" | null
  >(null);
  const [approvingMember, setApprovingMember] = useState<any | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadMembersData = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const res: any = await getShopMembersAndInvitationsApi(activeShopId);
      setShopInfo(res?.data?.shop || null);
      setMembers(res?.data?.members || []);
      setInvitations(res?.data?.invitations || []);
    } catch {}
  }, [activeShopId]);

  useEffect(() => {
    loadMembersData();
  }, [loadMembersData]);

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
      if (!activeShopId || !approvingMember) return;
      setIsApproving(true);
      const { defaultDiscount, defaultUnmask } = resolveRolePresetDefaults(
        value.assignedRole,
      );
      try {
        await approvePendingMemberApi(activeShopId, approvingMember.id, {
          assignedRole: value.assignedRole,
          assignedDataScope: value.assignedDataScope,
          maxDiscountPercent: defaultDiscount,
          unmaskPhoneHourlyLimit: defaultUnmask,
        });
        setApprovingMember(null);
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

  const handleQuickRoleUpdate = async (
    member: any,
    nextRole: ShopRoleType,
  ) => {
    if (!activeShopId) return;
    try {
      await updateMemberPermissionsApi(activeShopId, member.id, {
        role: nextRole,
        dataScope: member.dataScope,
        maxDiscountPercent: Number(member.maxDiscountPercent),
        unmaskPhoneHourlyLimit: member.unmaskPhoneHourlyLimit,
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

  const activeMembers = members.filter(
    (m) => m.membershipStatus !== "PENDING_APPROVAL",
  );
  const pendingMembers = members.filter(
    (m) => m.membershipStatus === "PENDING_APPROVAL",
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <GlassSectionHeader
        icon={<Users className="w-5 h-5" />}
        title={t("membersPage.title")}
        subtitle={t("membersPage.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {shopInfo?.joinCode && (
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
            )}
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              onClick={() => {
                setApprovingMember(null);
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
                        {m.user?.email} • {t(`scopes.${m.dataScope}`)} • Max
                        Discount: {m.maxDiscountPercent}%
                      </p>
                    </div>
                  </div>

                  {!isOwner && (
                    <div className="flex items-center gap-2">
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

                  <PatternButton
                    type="button"
                    variant="solid"
                    color="primary"
                    size="sm"
                    rounded="full"
                    onClick={() => {
                      setApprovingMember(m);
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {inv.invitedEmail}
                      </span>
                      <GlassBadge variant="primary" size="sm">
                        {t(`roles.${inv.targetRole}`)}
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(`scopes.${inv.targetDataScope}`)}
                    </p>
                  </div>
                  <GlassBadge
                    variant={inv.status === "ACCEPTED" ? "success" : "info"}
                    size="sm"
                  >
                    {inv.status}
                  </GlassBadge>
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

      {/* CHỈ HIỂN THỊ ĐÚNG 1 MODAL FORM DUY NHẤT TẠI MỘT THỜI ĐIỂM (INVITE HOẶC APPROVE) */}
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

      {activeModalMode === "APPROVE" && approvingMember && (
        <GlassModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setApprovingMember(null);
              setActiveModalMode(null);
            }
          }}
          title={t("membersPage.approveModalTitle")}
          description={approvingMember?.user?.email}
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
    </div>
  );
}
