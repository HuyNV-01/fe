"use client";

import { CheckCircle2, Mail, ShieldCheck, UserRoundPen } from "lucide-react";

import { ForgotPasswordForm } from "./forgot-password-form";
import { BaseSteps, type StepConfig } from "../steps/base-steps";
import { VerifyOtpForm } from "./verify-otp-form";
import { ResetPasswordForm } from "./reset-password-form";
import { SuccessOtp } from "../common/success-otp";

export function ForgotPasswordFlow() {
  const FORGOT_PASSWORD_STEPS: StepConfig[] = [
    {
      title: "Email",
      description: "Xác thực",
      icon: <Mail className="w-5 h-5" />,
      component: ({ onNext }) => <ForgotPasswordForm handleStep={onNext} />,
    },
    {
      title: "Verify OTP",
      description: "Bảo mật",
      icon: <ShieldCheck className="w-5 h-5" />,
      component: ({ onNext }) => <VerifyOtpForm handleStep={onNext} />,
    },
    {
      title: "Reset",
      description: "Mật khẩu mới",
      icon: <UserRoundPen className="w-5 h-5" />,
      component: ({ onNext }) => <ResetPasswordForm handleStep={onNext} />,
    },
    {
      title: "Done",
      description: "Hoàn tất",
      icon: <CheckCircle2 className="w-5 h-5" />,
      component: SuccessOtp,
    },
  ];

  return (
    <div className="w-full md:max-w-xl mx-auto p-4">
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
        containerClassName="mt-8"
      />
    </div>
  );
}
