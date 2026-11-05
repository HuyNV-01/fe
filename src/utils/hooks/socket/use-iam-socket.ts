"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import {
  type EffectiveMemberContextPayload,
  usePermissionStore,
} from "@/lib/stores/iam/use-permission-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { usePathname, useRouter } from "@/i18n/navigation";
import config from "@/config";

export const useIamSocket = () => {
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  const applyRealtimeEffectiveContext = usePermissionStore(
    (s) => s.applyRealtimeEffectiveContext,
  );
  const fetchOnboardingOverview = usePermissionStore(
    (s) => s.fetchOnboardingOverview,
  );
  const triggerMembersRefresh = usePermissionStore(
    (s) => s.triggerMembersRefresh,
  );

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.user?.id) return;

    // 1. Khi quyền hạn / vai trò của chính user hiện tại thay đổi (< 50ms Real-Time)
    const cleanPermissionsUpdated =
      socketService.on<EffectiveMemberContextPayload>(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.IAM.PERMISSIONS_UPDATED,
        async (payload) => {
          if (!payload) return;
          applyRealtimeEffectiveContext(payload);
          await fetchOnboardingOverview();
          triggerMembersRefresh();
        },
      );

    // 2. Khi user nhận được lời mời tham gia cửa hàng mới từ Chủ quán
    const cleanInvitationReceived = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_RECEIVED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    // 3. Khi lời mời bị Chủ quán thu hồi
    const cleanInvitationRevoked = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_REVOKED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    // 4. Khi nhân viên được mời đã bấm Chấp nhận lời mời (Chủ quán / Quản lý nhận sự kiện)
    const cleanInvitationAccepted = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_ACCEPTED,
      async () => {
        triggerMembersRefresh();
        await fetchOnboardingOverview();
      },
    );

    // 5. Khi có nhân viên mới gửi yêu cầu xin vào quán qua mã joinCode (Chủ quán / Quản lý nhận sự kiện)
    const cleanJoinRequestReceived = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.JOIN_REQUEST_RECEIVED,
      async () => {
        triggerMembersRefresh();
        await fetchOnboardingOverview();
      },
    );

    // 6. Khi yêu cầu xin vào quán của nhân viên được Chủ quán Phê duyệt -> Tự động mở khóa màn hình /onboarding!
    const cleanJoinRequestApproved = socketService.on<{
      shopId: string;
      shopName: string;
      role: string;
      effectiveContext?: EffectiveMemberContextPayload;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.JOIN_REQUEST_APPROVED,
      async (payload) => {
        if (payload?.effectiveContext) {
          applyRealtimeEffectiveContext(payload.effectiveContext);
        }
        await fetchOnboardingOverview();
        triggerMembersRefresh();

        if (pathname?.includes("/onboarding")) {
          router.push(config.routes.private.chat);
        }
      },
    );

    // 7. Khi yêu cầu xin vào quán bị Chủ quán Từ chối
    const cleanJoinRequestRejected = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.JOIN_REQUEST_REJECTED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    // 8. Khi trạng thái làm việc của nhân sự thay đổi (SUSPENDED / TERMINATED / ACTIVE)
    const cleanMemberStatusChanged = socketService.on<{
      shopId: string;
      membershipStatus: string;
      effectiveContext?: EffectiveMemberContextPayload;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.MEMBER_STATUS_CHANGED,
      async (payload) => {
        if (payload?.effectiveContext) {
          applyRealtimeEffectiveContext(payload.effectiveContext);
        }
        await fetchOnboardingOverview();
        triggerMembersRefresh();

        if (
          payload?.membershipStatus &&
          payload.membershipStatus !== "ACTIVE"
        ) {
          const nextState = usePermissionStore.getState();
          if (nextState.onboardingState !== "HAS_ACTIVE_SHOPS") {
            router.push(config.routes.private.onboarding);
          }
        }
      },
    );

    // 9. Khi danh sách nhân sự / lời mời / mã joinCode của cửa hàng có bất kỳ thay đổi nào
    const cleanShopMembersChanged = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.SHOP_MEMBERS_CHANGED,
      async () => {
        triggerMembersRefresh();
        await fetchOnboardingOverview();
      },
    );

    return () => {
      cleanPermissionsUpdated();
      cleanInvitationReceived();
      cleanInvitationRevoked();
      cleanInvitationAccepted();
      cleanJoinRequestReceived();
      cleanJoinRequestApproved();
      cleanJoinRequestRejected();
      cleanMemberStatusChanged();
      cleanShopMembersChanged();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    pathname,
    router,
    applyRealtimeEffectiveContext,
    fetchOnboardingOverview,
    triggerMembersRefresh,
  ]);
};
