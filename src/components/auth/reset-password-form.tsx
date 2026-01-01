import {
  Field,
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
import { resetPasswordSchema } from "@/Validation/reset-password-schema";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface ResetPasswordFormProps {
  handleStep: () => void;
}

export function ResetPasswordForm({ handleStep }: ResetPasswordFormProps) {
  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.ResetPassword");
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const form = useForm({
    defaultValues: {
      password: EMPTY_STRING,
      confirmPassword: EMPTY_STRING,
    },
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await resetPassword(
        {
          newPassword: value.password,
        },
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
      id="reset-password-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="password">
                      {tForm("label.newPassword")}
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
                      placeholder={tForm("placeholder.newPassword")}
                      className="rounded-full"
                    />
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
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="password"
                      placeholder={tForm("placeholder.confirmPassword")}
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
            form="reset-password-form"
            variant="solid"
            size="md"
            fullWidth
            rounded={"full"}
          >
            {tForm("button.submit")}
          </PatternButton>
        </Field>
      </FieldGroup>
    </form>
  );
}
