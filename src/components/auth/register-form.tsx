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
import { PatternButton } from "../button/button-patterns";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useTranslations } from "next-intl";
import LoginThird from "./login-third";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export function RegisterForm() {
  const router = useRouter();
  const tMessage = useTranslations("Messages.error");
  const tForm = useTranslations("Form.Register");
  const register = useAuthStore((s) => s.register);
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
        { ...value },
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

  return (
    <form
      id="register-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
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
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="text"
                      placeholder={tForm("placeholder.name")}
                      className="rounded-full"
                    />
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
