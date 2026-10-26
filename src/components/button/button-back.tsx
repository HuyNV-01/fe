"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ButtonBack() {
  const routes = useRouter();
  const t = useTranslations("Button");
  return (
    <Button
      variant={"ghost"}
      onClick={() => {
        routes.back();
      }}
      size="icon"
      aria-label={t("back")}
      className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
  );
}
