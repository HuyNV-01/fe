import { useTranslations } from "next-intl";
import { PatternButton } from "../button/button-patterns";
import { GoogleIcon } from "../icon/google-icon";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast } from "@/utils/toast";

export default function LoginThird() {
  const tForm = useTranslations("Form.Login");
  const tError = useTranslations("Messages.error");
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const handleWithGoogle = async () => {
    await loginWithGoogle({
      onError: (code) => {
        showErrorToast(tError(`toast.${code}`) || tError("toast.error"));
      },
    });
  };
  return (
    <PatternButton
      type="button"
      variant="glass"
      size="md"
      rounded={"full"}
      fullWidth
      icon={<GoogleIcon />}
      onClick={handleWithGoogle}
    >
      {tForm("button.google")}
    </PatternButton>
  );
}
