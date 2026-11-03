import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassEmptyState, PatternButton } from "@/components/toolkit";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

export function SuccessOtp() {
  const tForm = useTranslations("Common.Success");
  const router = useRouter();
  return (
    <GlassEmptyState
      icon={<Check className="w-8 h-8 text-emerald-500" />}
      title={tForm("title")}
      action={
        <PatternButton
          variant="solid"
          size="md"
          rounded="full"
          fullWidth
          onClick={() => {
            router.push(config.routes.public.login);
          }}
        >
          {tForm("button")}
        </PatternButton>
      }
      className="py-6 px-0"
    />
  );
}
