import { useTranslations } from "next-intl";
import { GlassSurfaceCard, PatternButton } from "@/components/toolkit";
import { RegisterForm } from "./register-form";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

export default function RegisterBase() {
  const tForm = useTranslations("Form.Register");
  const router = useRouter();
  return (
    <div className="w-full min-h-full py-6 px-4 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md">
        <GlassSurfaceCard
          className="p-5 sm:p-6"
          headerBorder={false}
          footerBorder={false}
          header={
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {tForm("title.register")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {tForm("description.title")}
                </p>
              </div>
              <PatternButton
                variant="link"
                size="sm"
                onClick={() => {
                  router.push(`${config.routes.public.login}`);
                }}
                className="px-0 h-auto"
              >
                {tForm("link.login")}
              </PatternButton>
            </div>
          }
        >
          <RegisterForm />
        </GlassSurfaceCard>
      </div>
    </div>
  );
}
