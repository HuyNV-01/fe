/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, User, ShieldCheck } from "lucide-react";
import { registerSchema } from "@/Validation/register-schema";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import { EMPTY_STRING } from "@/constant";
import {
  GlassAlert,
  LiquidGlassInput,
  PatternButton,
} from "@/components/toolkit";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useTranslations } from "next-intl";
import LoginThird from "./login-third";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import {
  type ShopRoleType,
  verifyInviteTokenPublicApi,
} from "@/lib/stores/iam/api";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface VerifiedInviteInfo {
  invitationId: string;
  shopId: string;
  shopName: string;
  invitedEmail: string;
  invitedName: string | null;
  targetRole: ShopRoleType;
  expiresAt: string;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawInviteToken = searchParams.get("inviteToken")?.trim() || "";

  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.Register");
  const tIam = useTranslations("OnboardingAndRoles");
  const register = useAuthStore((s) => s.register);

  const [verifiedInvite, setVerifiedInvite] =
    useState<VerifiedInviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<boolean>(false);

  const form = useForm({
    defaultValues: {
      name: EMPTY_STRING,
      email: EMPTY_STRING,
      password: EMPTY_STRING,
      confirmPassword: EMPTY_STRING,
    },
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      await register(
        {
          ...value,
          ...(rawInviteToken && verifiedInvite
            ? { inviteToken: rawInviteToken }
            : {}),
        },
        {
          onSuccess: (code) => {
            router.push(`${config.routes.public.login}`);
            showSuccessToast(tMessage(`toast.${code}`));
          },
          onError: (code) => {
            showErrorToast(
              tMessage(`toast.${code}`) || tMessage("toast.error"),
            );
          },
        },
      );
    },
  });

  useEffect(() => {
    if (!rawInviteToken) return;
    let isMounted = true;

    verifyInviteTokenPublicApi(rawInviteToken)
      .then((res: any) => {
        if (!isMounted) return;
        const data = res?.data as VerifiedInviteInfo | undefined;
        if (data?.invitedEmail) {
          setVerifiedInvite(data);
          setInviteError(false);
          form.setFieldValue("email", data.invitedEmail);
          if (data.invitedName) {
            form.setFieldValue("name", data.invitedName);
          }
        } else {
          setInviteError(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setInviteError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawInviteToken]);

  return (
    <form
      id="register-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {verifiedInvite && (
          <GlassAlert
            variant="info"
            icon={<ShieldCheck className="w-4 h-4" />}
            title={tIam("registerInviteBanner.title", {
              shopName: verifiedInvite.shopName,
            })}
            description={tIam("registerInviteBanner.description", {
              role: tIam(`roles.${verifiedInvite.targetRole}`),
              shopName: verifiedInvite.shopName,
            })}
          />
        )}

        {inviteError && (
          <GlassAlert
            variant="danger"
            title={tIam("registerInviteBanner.invalidTitle")}
            description={tIam("registerInviteBanner.invalidDescription")}
          />
        )}

        <FieldSet>
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="name">
                      {tForm("label.name")}
                      <span className="ml-0.5 text-red-400">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      {tForm("description.name")}
                    </FieldDescription>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <User className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          type="text"
                          placeholder={tForm("placeholder.name")}
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
            </form.Field>

            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="email">
                      {tForm("label.email")}
                      <span className="ml-0.5 text-red-400">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      {tForm("description.email")}
                    </FieldDescription>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Mail className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          readOnly={Boolean(verifiedInvite)}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            if (!verifiedInvite) {
                              field.handleChange(e.target.value);
                            }
                          }}
                          aria-invalid={isInvalid}
                          type="email"
                          placeholder={tForm("placeholder.email")}
                          className={cn(
                            "flex h-full w-full py-2 text-sm",
                            "bg-transparent!",
                            "border-none",
                            "shadow-none",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "px-0",
                            verifiedInvite && "opacity-80 cursor-not-allowed",
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
            </form.Field>

            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="password">
                      {tForm("label.password")}
                      <span className="ml-0.5 text-red-400">*</span>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Lock className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          type="password"
                          placeholder={tForm("placeholder.password")}
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
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="confirmPassword">
                      {tForm("label.confirmPassword")}
                      <span className="ml-0.5 text-red-400">*</span>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Lock className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          type="password"
                          placeholder={tForm("placeholder.confirmPassword")}
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
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <Field className="space-y-3">
          <PatternButton
            type="submit"
            form="register-form"
            variant="solid"
            size="md"
            fullWidth
            rounded={"full"}
          >
            {tForm("button.register")}
          </PatternButton>
          <FieldSeparator className="mb-2">{tForm("title.or")}</FieldSeparator>
          <LoginThird />
        </Field>
      </FieldGroup>
    </form>
  );
}
