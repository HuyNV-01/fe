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
  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.Login");
  const login = useAuthStore((s) => s.login);
  const form = useForm({
    defaultValues: {
      email: EMPTY_STRING,
      password: EMPTY_STRING,
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      await login(
        { ...value },
        {
          onSuccess: (code) => {
            router.push(`${config.routes.public.home}`);
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
        <Field className="space-y-3">
          <PatternButton
            type="submit"
            form="login-form"
            variant="solid"
            size="md"
            fullWidth
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
