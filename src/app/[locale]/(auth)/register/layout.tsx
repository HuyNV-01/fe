import type { IProps } from "@/types";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Omit<IProps, "children">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BaseLayout.Register" });

  return {
    title: t("label"),
  };
}

export default function LayoutRegister({ children }: IProps) {
  return <div className="w-full p-5 flex flex-col items-start">{children}</div>;
}
