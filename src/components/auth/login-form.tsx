/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import { EMPTY_STRING } from "@/constant";
import { PatternButton } from "../button/button-patterns";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useTranslations } from "next-intl";
import { loginSchema } from "@/Validation/login-schema";
import LoginThird from "./login-third";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activatedParam = searchParams.get("activated");
  const activationHandledRef = useRef(false);

  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.Login");
  const login = useAuthStore((s) => s.login);
  const resendActivation = useAuthStore((s) => s.resendActivation);
  const status = useAuthStore((s) => s.status);

  const [pendingActivationEmail, setPendingActivationEmail] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!activatedParam || activationHandledRef.current) return;
    activationHandledRef.current = true;

    if (activatedParam === "true") {
      showSuccessToast(tMessage("toast.3010"));
    } else if (activatedParam === "failed") {
      showErrorToast(tMessage("toast.3011"));
    }
  }, [activatedParam]);

  const form = useForm({
    defaultValues: {
      email: EMPTY_STRING,
      password: EMPTY_STRING,
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setPendingActivationEmail(null);
      await login(
        { ...value },
        {
          onSuccess: (code) => {
            router.push(`${config.routes.private.chat}`);
            showSuccessToast(tMessage(`toast.${code}`));
          },
          onError: (code) => {
            if (Number(code) === 3003) {
              setPendingActivationEmail(value.email.trim());
            }
            showErrorToast(
              tMessage(`toast.${code}`) || tMessage("toast.error"),
            );
          },
        },
      );
    },
  });

  const handleResendActivation = async () => {
    if (!pendingActivationEmail) return;
    await resendActivation(
      { email: pendingActivationEmail },
      {
        onSuccess: (code) => {
          showSuccessToast(tMessage(`toast.${code || 3022}`));
          setPendingActivationEmail(null);
        },
        onError: (code) => {
          showErrorToast(tMessage(`toast.${code}`) || tMessage("toast.error"));
        },
      },
    );
  };

  return (
    <form
      id="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
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
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="email"
                      placeholder={tForm("placeholder.email")}
                      className="rounded-full"
                    />
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
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="password"
                      placeholder={tForm("placeholder.password")}
                      className="rounded-full"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>

        {pendingActivationEmail && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 text-xs">
            <p className="text-amber-700 dark:text-amber-300 font-medium">
              Tài khoản{" "}
              <span className="font-bold">{pendingActivationEmail}</span> chưa
              được kích hoạt.
            </p>
            <PatternButton
              type="button"
              variant="outline"
              color="warning"
              size="sm"
              rounded="full"
              isLoading={status === "wait"}
              icon={<MailCheck className="w-3.5 h-3.5" />}
              onClick={handleResendActivation}
            >
              {tForm("button.resendActivation")}
            </PatternButton>
          </div>
        )}

        <Field className="space-y-3">
          <PatternButton
            type="submit"
            form="login-form"
            variant="solid"
            size="md"
            fullWidth
            isLoading={status === "loading"}
            rounded={"full"}
          >
            {tForm("button.login")}
          </PatternButton>
          <FieldSeparator className="mb-2">{tForm("title.or")}</FieldSeparator>
          <LoginThird />
        </Field>
      </FieldGroup>
    </form>
  );
}
