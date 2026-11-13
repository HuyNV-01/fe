/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Store,
  UserPlus,
  MailCheck,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Users,
  Phone,
  MapPin,
  KeyRound,
  FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
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
  LiquidGlass,
  LiquidGlassInput,
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAlert,
  GlassEmptyState,
  PatternButton,
} from "@/components/toolkit";
import { EMPTY_STRING } from "@/constant";
import { MESSAGES } from "@/constant/messages";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { cn } from "@/lib/utils";
import config from "@/config";

type OnboardingTabMode = "CREATE_SHOP" | "JOIN_BY_CODE" | "INVITATIONS";

const createShopSchema = z.object({
  shopName: z.string().trim().min(2, MESSAGES.ZOD.AUTH.REGISTER.NAME.SHORT),
  contactPhone: z.string().trim(),
  defaultAddressLine: z.string().trim(),
});

const joinShopByCodeSchema = z.object({
  joinCode: z.string().trim().min(4, MESSAGES.ZOD.PRODUCT.CREATE.CODE.REQUIRED),
  requestedNote: z.string().trim(),
});

export default function WorkspaceOnboardingPage() {
  const t = useTranslations("OnboardingAndRoles");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as OnboardingTabMode | null;

  const onboardingState = usePermissionStore((s) => s.onboardingState);
  const memberships = usePermissionStore((s) => s.memberships);
  const pendingInvitations = usePermissionStore((s) => s.pendingInvitations);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);
  const fetchOnboardingOverview = usePermissionStore(
    (s) => s.fetchOnboardingOverview,
  );
  const createShopAsOwner = usePermissionStore((s) => s.createShopAsOwner);
  const requestJoinByCode = usePermissionStore((s) => s.requestJoinByCode);
  const acceptInvitation = usePermissionStore((s) => s.acceptInvitation);

  const [activeTab, setActiveTab] = useState<OnboardingTabMode>("CREATE_SHOP");
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOnboardingOverview();
  }, [fetchOnboardingOverview, membersRefreshTick]);

  // Hỗ trợ điều hướng trực tiếp từ NotificationBell qua ?tab=INVITATIONS hoặc ?tab=JOIN_BY_CODE
  useEffect(() => {
    if (
      tabParam === "CREATE_SHOP" ||
      tabParam === "JOIN_BY_CODE" ||
      tabParam === "INVITATIONS"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Nếu tài khoản nhận được lời mời Real-Time từ Chủ quán, tự động ưu tiên mở tab Lời mời
  useEffect(() => {
    if (!tabParam && pendingInvitations.length > 0) {
      setActiveTab("INVITATIONS");
    } else if (activeTab === "INVITATIONS" && pendingInvitations.length === 0) {
      setActiveTab("CREATE_SHOP");
    }
  }, [pendingInvitations.length, tabParam]);

  const handleTabChange = (nextTab: OnboardingTabMode) => {
    setActiveTab(nextTab);
    createShopForm.reset();
    joinShopForm.reset();
  };

  const createShopForm = useForm({
    defaultValues: {
      shopName: EMPTY_STRING,
      contactPhone: EMPTY_STRING,
      defaultAddressLine: EMPTY_STRING,
    },
    validators: {
      onChange: createShopSchema,
    },
    onSubmit: async ({ value }) => {
      setIsCreatingShop(true);
      try {
        await createShopAsOwner({
          shopName: value.shopName.trim(),
          contactPhone: value.contactPhone.trim() || undefined,
          defaultAddressLine: value.defaultAddressLine.trim() || undefined,
        });
        showSuccessToast(
          t("createShopCard.successToastDesc", {
            shopName: value.shopName.trim(),
          }),
          {
            title: t("createShopCard.successToastTitle"),
          },
        );
        router.push(`${config.routes.private.settingsMembers}`);
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Error", {
          title: t("createShopCard.title"),
        });
      } finally {
        setIsCreatingShop(false);
      }
    },
  });

  const joinShopForm = useForm({
    defaultValues: {
      joinCode: EMPTY_STRING,
      requestedNote: EMPTY_STRING,
    },
    validators: {
      onChange: joinShopByCodeSchema,
    },
    onSubmit: async ({ value }) => {
      setIsJoiningByCode(true);
      try {
        await requestJoinByCode({
          joinCode: value.joinCode.trim().toUpperCase(),
          requestedNote: value.requestedNote.trim() || undefined,
        });
        joinShopForm.reset();
        showSuccessToast(t("joinShopCard.pendingToastDesc"), {
          title: t("joinShopCard.pendingToastTitle"),
        });
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Invalid join code", {
          title: t("joinShopCard.title"),
        });
      } finally {
        setIsJoiningByCode(false);
      }
    },
  });

  const handleAcceptInvite = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      await acceptInvitation(invitationId);
      showSuccessToast(t("invitationsSection.acceptedToastDesc"), {
        title: t("invitationsSection.acceptedToastTitle"),
      });
      router.push(`${config.routes.private.chat}`);
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed", {
        title: t("invitationsSection.title"),
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const pendingApprovalShops = memberships.filter(
    (m) => m.membershipStatus === "PENDING_APPROVAL",
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <GlassSectionHeader
        icon={<ShieldCheck className="w-5 h-5" />}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
      />

      {onboardingState === "UNBOUND_USER" && (
        <GlassAlert
          variant="info"
          title={t("initialAccountStatusNoticeTitle")}
          description={t("initialAccountStatusNoticeDesc")}
        />
      )}

      {/* THANH CHUYỂN TAB: ĐẢM BẢO MỖI THỜI ĐIỂM CHỈ HIỂN THỊ ĐÚNG 1 FORM / 1 MỤC ĐÍCH DUY NHẤT */}
      <GlassTabs
        fullWidth
        value={activeTab}
        onValueChange={handleTabChange}
        items={[
          {
            key: "CREATE_SHOP",
            label: t("createShopCard.title"),
            icon: <Store className="w-4 h-4" />,
          },
          {
            key: "JOIN_BY_CODE",
            label: t("joinShopCard.title"),
            icon: <UserPlus className="w-4 h-4" />,
            badge: pendingApprovalShops.length,
          },
          ...(pendingInvitations.length > 0 || activeTab === "INVITATIONS"
            ? [
                {
                  key: "INVITATIONS" as OnboardingTabMode,
                  label: t("invitationsSection.title"),
                  icon: <MailCheck className="w-4 h-4" />,
                  badge: pendingInvitations.length,
                },
              ]
            : []),
        ]}
      />

      {/* TAB 1: TÔI LÀ CHỦ QUÁN — MỞ CỬA HÀNG MỚI (SHOP_OWNER) */}
      {activeTab === "CREATE_SHOP" && (
        <GlassSurfaceCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm sm:text-base">
                  {t("createShopCard.title")}
                </span>
              </div>
              <GlassBadge variant="primary" size="sm">
                {t("roles.SHOP_OWNER")}
              </GlassBadge>
            </div>
          }
        >
          <form
            id="create-shop-form"
            onSubmit={(e) => {
              e.preventDefault();
              createShopForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldDescription className="text-xs leading-relaxed">
                  {t("createShopCard.description")}
                </FieldDescription>

                <FieldGroup>
                  <createShopForm.Field name="shopName">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("createShopCard.title")}
                            <span className="ml-0.5 text-red-400">*</span>
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <Store className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
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
                                placeholder={t(
                                  "createShopCard.shopNamePlaceholder",
                                )}
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
                  </createShopForm.Field>

                  <createShopForm.Field name="contactPhone">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("createShopCard.phonePlaceholder")}
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <Phone className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
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
                                placeholder={t(
                                  "createShopCard.phonePlaceholder",
                                )}
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
                  </createShopForm.Field>

                  <createShopForm.Field name="defaultAddressLine">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("createShopCard.addressPlaceholder")}
                          </FieldLabel>
                          <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                            <div className="flex items-center px-3.5 w-full h-full">
                              <MapPin className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
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
                                placeholder={t(
                                  "createShopCard.addressPlaceholder",
                                )}
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
                  </createShopForm.Field>
                </FieldGroup>
              </FieldSet>

              <Field className="space-y-3">
                <PatternButton
                  type="submit"
                  form="create-shop-form"
                  variant="solid"
                  color="primary"
                  size="md"
                  rounded={"full"}
                  fullWidth
                  isLoading={isCreatingShop}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {t("createShopCard.submitBtn")}
                </PatternButton>
              </Field>
            </FieldGroup>
          </form>
        </GlassSurfaceCard>
      )}

      {/* TAB 2: TÔI LÀ NHÂN VIÊN / KẾ TOÁN / KHO — XIN VÀO QUÁN QUA MÃ JOIN CODE */}
      {activeTab === "JOIN_BY_CODE" && (
        <div className="space-y-5">
          <GlassSurfaceCard
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-sm sm:text-base">
                    {t("joinShopCard.title")}
                  </span>
                </div>
                <GlassBadge variant="accent" size="sm">
                  <Users className="w-3 h-3 mr-1 inline" />
                  {t("joinShopCard.roleBadge")}
                </GlassBadge>
              </div>
            }
          >
            <form
              id="join-shop-form"
              onSubmit={(e) => {
                e.preventDefault();
                joinShopForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <FieldSet>
                  <FieldDescription className="text-xs leading-relaxed">
                    {t("joinShopCard.description")}
                  </FieldDescription>

                  <FieldGroup>
                    <joinShopForm.Field name="joinCode">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              {t("joinShopCard.joinCodePlaceholder")}
                              <span className="ml-0.5 text-red-400">*</span>
                            </FieldLabel>
                            <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                              <div className="flex items-center px-3.5 w-full h-full">
                                <KeyRound className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(
                                      e.target.value.toUpperCase(),
                                    )
                                  }
                                  aria-invalid={isInvalid}
                                  type="text"
                                  placeholder={t(
                                    "joinShopCard.joinCodePlaceholder",
                                  )}
                                  className={cn(
                                    "flex h-full w-full py-2 text-sm font-mono uppercase",
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
                    </joinShopForm.Field>

                    <joinShopForm.Field name="requestedNote">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              {t("joinShopCard.notePlaceholder")}
                            </FieldLabel>
                            <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                              <div className="flex items-center px-3.5 w-full h-full">
                                <FileText className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
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
                                  placeholder={t(
                                    "joinShopCard.notePlaceholder",
                                  )}
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
                    </joinShopForm.Field>
                  </FieldGroup>
                </FieldSet>

                <Field className="space-y-3">
                  <PatternButton
                    type="submit"
                    form="join-shop-form"
                    variant="solid"
                    color="info"
                    size="md"
                    rounded={"full"}
                    fullWidth
                    isLoading={isJoiningByCode}
                    icon={<Clock className="w-4 h-4" />}
                  >
                    {t("joinShopCard.submitBtn")}
                  </PatternButton>
                </Field>
              </FieldGroup>
            </form>
          </GlassSurfaceCard>

          {pendingApprovalShops.length > 0 && (
            <GlassSurfaceCard
              header={
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm sm:text-base">
                    {t("pendingRequestsSection.title")}
                  </span>
                </div>
              }
            >
              <div className="space-y-2.5">
                {pendingApprovalShops.map((p) => (
                  <LiquidGlass
                    key={p.memberId}
                    variant="warning"
                    opacity="10"
                    blur="md"
                    rounded="xl"
                    isolate={false}
                    className="p-3.5"
                    contentClassName="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold">{p.shopName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("pendingRequestsSection.waitingOwnerNotice")}
                      </p>
                    </div>
                    <GlassBadge variant="warning" size="sm" pulse dot>
                      {t("status.PENDING_APPROVAL")}
                    </GlassBadge>
                  </LiquidGlass>
                ))}
              </div>
            </GlassSurfaceCard>
          )}
        </div>
      )}

      {/* TAB 3: LỜI MỜI ĐỊNH DANH ĐANG CHỜ CHẤP NHẬN (LUỒNG 2) */}
      {activeTab === "INVITATIONS" && (
        <GlassSurfaceCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm sm:text-base">
                  {t("invitationsSection.title")}
                </span>
              </div>
              <GlassBadge variant="success" size="sm" pulse dot>
                {pendingInvitations.length}
              </GlassBadge>
            </div>
          }
        >
          {pendingInvitations.length === 0 ? (
            <GlassEmptyState
              icon={<MailCheck className="w-6 h-6" />}
              title={t("invitationsSection.title")}
            />
          ) : (
            <div className="space-y-2.5">
              {pendingInvitations.map((inv) => (
                <LiquidGlass
                  key={inv.invitationId}
                  variant="success"
                  opacity="10"
                  blur="md"
                  rounded="xl"
                  isolate={false}
                  className="p-3.5"
                  contentClassName="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{inv.shopName}</span>
                      <GlassBadge variant="primary" size="sm">
                        {t(`roles.${inv.targetRole}`)}
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("invitationsSection.invitedByLabel", {
                        name: inv.invitedByName,
                      })}
                    </p>
                  </div>

                  <PatternButton
                    type="button"
                    variant="solid"
                    color="success"
                    size="sm"
                    rounded="full"
                    isLoading={acceptingId === inv.invitationId}
                    onClick={() => handleAcceptInvite(inv.invitationId)}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {t("invitationsSection.acceptBtn")}
                  </PatternButton>
                </LiquidGlass>
              ))}
            </div>
          )}
        </GlassSurfaceCard>
      )}
    </div>
  );
}
