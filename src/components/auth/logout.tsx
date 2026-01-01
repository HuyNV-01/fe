import config from "@/config";
import { useRouter } from "@/i18n/navigation";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import ItemMenu from "../dropdown-menu/item-menu";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";

export default function Logout() {
  const t = useTranslations("DropdownMenu.account");
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout({
      onSuccess: () => {
        router.push(`${config.routes.public.home}`);
      },
    });
  };
  return (
    <ItemMenu
      icon={<LogOut className="size-4 text-rose-500" />}
      onClick={handleLogout}
      className=" text-rose-500 hover:text-rose-500! cursor-pointer"
    >
      {t("logout")}
    </ItemMenu>
  );
}
