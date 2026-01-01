import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatternButton } from "../button/button-patterns";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { AccountMenu } from "../dropdown-menu/account-menu";

interface NavActionsProps {
  actions: {
    showSignIn?: boolean;
    showSignUp?: boolean;
    showAccount?: boolean;
  };
  className?: string;
}

export function NavActions({ actions, className }: NavActionsProps) {
  const t = useTranslations("Header.action");
  const router = useRouter();

  const handleLogin = () => {
    router.push(`${config.routes.public.login}`);
  };

  const handleRegister = () => {
    router.push(`${config.routes.public.register}`);
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.showSignIn && (
        <PatternButton
          variant="glass"
          size="md"
          className="w-32"
          rounded={"full"}
          onClick={handleLogin}
        >
          {t("login")}
        </PatternButton>
      )}

      {actions.showSignUp && (
        <PatternButton
          variant="solid"
          size="md"
          className="w-32"
          rounded={"full"}
          onClick={handleRegister}
        >
          {t("register")}
        </PatternButton>
      )}

      {actions.showAccount && <AccountMenu />}
    </div>
  );
}
