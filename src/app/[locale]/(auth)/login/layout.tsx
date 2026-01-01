import type { IProps } from "@/types";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Omit<IProps, "children">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseLayout.Login" });

  return {
    title: t("label"),
  };
}

export default function LayoutLogin({ children }: IProps) {
  return <div className="w-full p-5 flex flex-col items-start">{children}</div>;
}
