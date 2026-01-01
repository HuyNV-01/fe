import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { LoginForm } from "./login-form";
import { LiquidGlassCard } from "../liquid-glass/liquid-glass";

export default function LoginBase() {
  const tForm = useTranslations("Form.Login");
  const router = useRouter();
  return (
    <div className="w-full flex items-start justify-center">
      <div className="relative z-10 w-full max-w-md">
        <LiquidGlassCard>
          <Card className="bg-transparent border-0">
            <CardHeader>
              <CardTitle>{tForm("title.login")}</CardTitle>
              <CardDescription>{tForm("description.title")}</CardDescription>
              <CardAction>
                <Button
                  variant="link"
                  onClick={() => {
                    router.push(`${config.routes.public.register}`);
                  }}
                >
                  {tForm("link.register")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter className="flex justify-end">
              <CardAction>
                <Button
                  variant="link"
                  onClick={() => {
                    router.push(`${config.routes.public.forgotPassword}`);
                  }}
                  className="hover:text-sky-600"
                >
                  {tForm("link.forgot")}
                </Button>
              </CardAction>
            </CardFooter>
          </Card>
        </LiquidGlassCard>
      </div>
    </div>
  );
}
