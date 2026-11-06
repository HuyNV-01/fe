// File: src/components/navigation/nav-actions.tsx
import { cn } from "@/lib/utils";
import { PatternButton, TruncatedText } from "@/components/toolkit";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { AccountMenu } from "../dropdown-menu/account-menu";
import { NotificationBell } from "../notifications/notification-bell";
import { ShopWorkspaceSwitcher } from "../iam/shop-workspace-switcher";
import { ShiftStatusSwitcher } from "../iam/shift-status-switcher";

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
          type="button"
          variant="glass"
          size="md"
          className="w-32"
          rounded={"full"}
          onClick={handleLogin}
          glassZIndex={40}
        >
          <TruncatedText>{t("login")}</TruncatedText>
        </PatternButton>
      )}

      {actions.showSignUp && (
        <PatternButton
          type="button"
          variant="solid"
          color="primary"
          size="md"
          className="w-32"
          rounded={"full"}
          onClick={handleRegister}
        >
          <TruncatedText>{t("register")}</TruncatedText>
        </PatternButton>
      )}

      {actions.showAccount && (
        <>
          <ShiftStatusSwitcher />
          <ShopWorkspaceSwitcher />
          <NotificationBell />
          <AccountMenu />
        </>
      )}
    </div>
  );
}
