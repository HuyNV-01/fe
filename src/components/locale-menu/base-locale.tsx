"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale, routing } from "@/i18n/routing";
import { DropdownMenuCheckboxItem } from "../ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import BaseLocaleSelect from "./base-locale-select";

export default function BaseLocale() {
  const t = useTranslations("Button.LocaleSwitcher");
  const locale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState<string>(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onSelectChange(value: string) {
    const nextLocale = value as Locale;
    startTransition(() => {
      router.replace({ pathname }, { locale: nextLocale });
    });
  }
  function handleCheckedChange(newLocale: string) {
    setSelectedLocale(newLocale);
    onSelectChange(newLocale);
  }

  return (
    <BaseLocaleSelect label={t("label")} isPending={isPending}>
      {routing.locales.map((curLocale) => (
        <DropdownMenuCheckboxItem
          key={curLocale}
          checked={selectedLocale === curLocale}
          onCheckedChange={() => handleCheckedChange(curLocale)}
        >
          {t("locale", { locale: curLocale })}
        </DropdownMenuCheckboxItem>
      ))}
    </BaseLocaleSelect>
  );
}
