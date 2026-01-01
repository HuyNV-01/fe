/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { useForm } from "@tanstack/react-form";
import {
  DEFAULT_LENGTH_OTP,
  DEFAULT_TIMEOUT_OTP,
  EMPTY_STRING,
  KEY_TIMEOUT_OTP,
} from "@/constant";
import { PatternButton } from "../button/button-patterns";
import { useTranslations } from "next-intl";
import { Spinner } from "../ui/spinner";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { verifyOtpSchema } from "@/Validation/verify-otp-schema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../ui/input-otp";
import { REGEX_PATTERN } from "@/constant/regex-pattern";
import { Button } from "../ui/button";
import { usePersistentCountdown } from "@/utils/hooks/use-persistent-countdown";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface VerifyOtpFormProps {
  handleStep: () => void;
}

export function VerifyOtpForm({ handleStep }: VerifyOtpFormProps) {
  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.VerifyOtp");
  const dataValue = useAuthStore((state) => state.value);
  const authStatus = useAuthStore((state) => state.status);
  const isWait = useStoreWait(authStatus);
  const { seconds, isFinished, start, formatTime } = usePersistentCountdown(
    KEY_TIMEOUT_OTP,
    DEFAULT_TIMEOUT_OTP,
  );
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const handleReSendOtp = async () => {
    if (dataValue?.email) {
      await forgotPassword(
        { email: dataValue?.email },
        {
          onSuccess: (code) => {
            handleStep();
            showSuccessToast(tMessage(`toast.${code}`));
          },
          onError: (code) => {
            showErrorToast(
              tMessage(`toast.${code}`) || tMessage("toast.error"),
            );
          },
        },
      );
    }
  };

  const form = useForm({
    defaultValues: {
      otp: EMPTY_STRING,
    },
    validators: {
      onChange: verifyOtpSchema,
    },
    onSubmit: async ({ value }) => {
      await verifyOtp(
        { ...value },
        {
          onSuccess: (code) => {
            handleStep();
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
    start();
  }, []);

  return (
    <form
      id="verify-otp-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <form.Field name="otp">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="otp">
                      {tForm("label.otp")}
                      <span className="ml-0.5 text-red-400">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      {tForm("description.otp")}
                    </FieldDescription>
                    <div className="w-full flex items-center justify-center">
                      <InputOTP
                        maxLength={DEFAULT_LENGTH_OTP}
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e)}
                        aria-invalid={isInvalid}
                        pattern={REGEX_PATTERN.numericOnly.source}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="w-full flex items-center justify-start">
                      <Button
                        variant={"link"}
                        className="hover:text-sky-600"
                        onClick={handleReSendOtp}
                      >
                        {tForm("button.reSend")}
                      </Button>
                      <p className="text-sky-600">
                        <span className="font-mono font-bold text-sky-600 text-base">
                          {formatTime()}
                        </span>
                      </p>
                    </div>
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <Field className="space-y-3">
          <PatternButton
            type="submit"
            form="verify-otp-form"
            variant="solid"
            size="md"
            fullWidth
            disabled={isWait}
            rounded={"full"}
          >
            {isWait ? <Spinner /> : tForm("button.submit")}
          </PatternButton>
        </Field>
      </FieldGroup>
    </form>
  );
}
