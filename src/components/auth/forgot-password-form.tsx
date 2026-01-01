import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import { EMPTY_STRING } from "@/constant";
import { PatternButton } from "../button/button-patterns";
import { useTranslations } from "next-intl";
import { forgotPasswordSchema } from "@/Validation/forgot-password-schema";
import { Spinner } from "../ui/spinner";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface ForgotPasswordFormProps {
  handleStep: () => void;
}

export function ForgotPasswordForm({ handleStep }: ForgotPasswordFormProps) {
  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.ForgotPassword");
  const authStatus = useAuthStore((state) => state.status);
  const isWait = useStoreWait(authStatus);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const form = useForm({
    defaultValues: {
      email: EMPTY_STRING,
    },
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await forgotPassword(
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

  return (
    <form
      id="forgot-password-form"
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
                    <FieldDescription>
                      {tForm("description.email")}
                    </FieldDescription>
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
          </FieldGroup>
        </FieldSet>
        <Field className="space-y-3">
          <PatternButton
            type="submit"
            form="forgot-password-form"
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
