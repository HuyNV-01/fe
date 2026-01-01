import { Check, RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTranslations } from "next-intl";
import { PatternButton } from "../button/button-patterns";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

export function SuccessOtp() {
  const tForm = useTranslations("Common.Success");
  const router = useRouter();
  return (
    <Empty className="p-0!">
      <EmptyHeader>
        <EmptyMedia>
          <Check className="w-12 h-12 text-green-500" />
        </EmptyMedia>
        <EmptyTitle>{tForm("title")}</EmptyTitle>
        <EmptyDescription></EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <PatternButton
          variant="solid"
          size="md"
          fullWidth
          onClick={() => {
            router.push(config.routes.public.login);
          }}
        >
          {tForm("button")}
        </PatternButton>
      </EmptyContent>
    </Empty>
  );
}
