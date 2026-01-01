import { SocketProvider } from "@/components/socket-provider";
import AuthGuard from "@/lib/stores/auth-guard";
import type { TProps } from "@/types";

export default function DashboardLayout({ children }: TProps) {
  return (
    <AuthGuard>
      <SocketProvider>{children}</SocketProvider>
    </AuthGuard>
  );
}
