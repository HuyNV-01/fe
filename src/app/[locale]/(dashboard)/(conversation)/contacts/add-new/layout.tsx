import type { IProps } from "@/types";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Omit<IProps, "children">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseLayout.Contacts" });

  return {
    title: t("addNew"),
  };
}

export default function AddNewContactsLayout({ children }: IProps) {
  return children;
}
