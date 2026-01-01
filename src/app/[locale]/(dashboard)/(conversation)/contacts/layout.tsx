import { getTranslations } from "next-intl/server";
import type React from "react";
import type { IProps } from "@/types";

export async function generateMetadata({ params }: Omit<IProps, "children">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseLayout.Contacts" });

  return {
    title: t("label"),
  };
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
