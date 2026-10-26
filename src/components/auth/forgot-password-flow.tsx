"use client";

import { CheckCircle2, Mail, ShieldCheck, UserRoundPen } from "lucide-react";
import { useTranslations } from "next-intl";

import { ForgotPasswordForm } from "./forgot-password-form";
import { BaseSteps, type StepConfig } from "../steps/base-steps";
import { VerifyOtpForm } from "./verify-otp-form";
import { ResetPasswordForm } from "./reset-password-form";
import { SuccessOtp } from "../common/success-otp";

export function ForgotPasswordFlow() {
  const t = useTranslations("Form.ForgotPassword.steps");

  const FORGOT_PASSWORD_STEPS: StepConfig[] = [
    {
      title: t("emailTitle"),
      description: t("emailDesc"),
      icon: <Mail className="w-5 h-5" />,
      component: ({ onNext }) => <ForgotPasswordForm handleStep={onNext} />,
    },
    {
      title: t("otpTitle"),
      description: t("otpDesc"),
      icon: <ShieldCheck className="w-5 h-5" />,
      component: ({ onNext }) => <VerifyOtpForm handleStep={onNext} />,
    },
    {
      title: t("resetTitle"),
      description: t("resetDesc"),
      icon: <UserRoundPen className="w-5 h-5" />,
      component: ({ onNext }) => <ResetPasswordForm handleStep={onNext} />,
    },
    {
      title: t("doneTitle"),
      description: t("doneDesc"),
      icon: <CheckCircle2 className="w-5 h-5" />,
      component: SuccessOtp,
    },
  ];

  return (
    <div className="w-full md:max-w-xl mx-auto p-3 sm:p-4">
      <BaseSteps
        steps={FORGOT_PASSWORD_STEPS}
        size="sm"
        variant="minimal"
        orientation="horizontal"
        mobileLayout="stack"
        labelPlacement="bottom"
        showProgressBar={false}
        allowClickNavigation={false}
        connectorConfig={{
          show: true,
          animated: true,
          style: "solid",
          color: "#3b82f6",
        }}
        containerClassName="mt-6 sm:mt-8"
      />
    </div>
  );
}
