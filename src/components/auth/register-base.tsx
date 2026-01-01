import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { RegisterForm } from "./register-form";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { LiquidGlassCard } from "../liquid-glass/liquid-glass";

export default function RegisterBase() {
  const tForm = useTranslations("Form.Register");
  const router = useRouter();
  return (
    <div className="w-full flex items-start justify-center">
      <div className="relative z-10 w-full max-w-md">
        <LiquidGlassCard>
          <Card className="bg-transparent border-0">
            <CardHeader>
              <CardTitle>{tForm("title.register")}</CardTitle>
              <CardDescription>{tForm("description.title")}</CardDescription>
              <CardAction>
                <Button
                  variant="link"
                  onClick={() => {
                    router.push(`${config.routes.public.login}`);
                  }}
                >
                  {tForm("link.login")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
        </LiquidGlassCard>
      </div>
    </div>
  );
}
