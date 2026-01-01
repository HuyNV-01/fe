import { MENU_GROUPS } from "@/constant/chat";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export const useContactMenu = () => {
  const t = useTranslations("Chat.Detail");

  const menuGroups = useMemo(() => {
    return MENU_GROUPS.map((group) => ({
      ...group,
      title: group.title ? t(group.title) : undefined,
      items: group.items.map((item) => ({
        ...item,
        label: t(item.label),
      })),
    }));
  }, [t]);

  return { menuGroups };
};
