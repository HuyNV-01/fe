import type { IProps } from "@/types";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Omit<IProps, "children">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseLayout.Profile" });

  return {
    title: t("detail"),
  };
}

export default function ProfileLayout({ children }: IProps) {
  return children;
}
