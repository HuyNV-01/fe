"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import {
  type EffectiveMemberContextPayload,
  type ShiftStatusType,
  usePermissionStore,
} from "@/lib/stores/iam/use-permission-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { usePathname, useRouter } from "@/i18n/navigation";
import config from "@/config";
import { tStore } from "@/i18n/translate-store";
import { showWarningToast } from "@/utils/toast";

export const useIamSocket = () => {
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  const applyRealtimeEffectiveContext = usePermissionStore(
    (s) => s.applyRealtimeEffectiveContext,
  );
  const setActiveShopContext = usePermissionStore(
    (s) => s.setActiveShopContext,
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

    const cleanShiftStatusChanged = socketService.on<{
      shopId: string;
      userId: string;
      shiftStatus: ShiftStatusType;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.SHIFT_STATUS_CHANGED,
      async (payload) => {
        if (!payload) return;
        setActiveShopContext({ shiftStatus: payload.shiftStatus });
        triggerMembersRefresh();
      },
    );

    const cleanForceShiftHandover = socketService.on<{
      shopId: string;
      forcedByManagerId: string;
      reassignedConversationCount: number;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.FORCE_SHIFT_HANDOVER,
      async (payload) => {
        setActiveShopContext({
          shiftStatus: "OFFLINE",
          isHandoverModalOpen: false,
          pendingHandoverCount: 0,
        });
        showWarningToast(
          tStore("ShiftAndIam.handoverModal.forceOfflineWarning", {
            count: payload?.reassignedConversationCount || 0,
          }),
          {
            title: tStore("ShiftAndIam.status.OFFLINE"),
          },
        );
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    const cleanInvitationReceived = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_RECEIVED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    const cleanInvitationRevoked = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_REVOKED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

    const cleanInvitationAccepted = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.INVITATION_ACCEPTED,
      async () => {
        triggerMembersRefresh();
        await fetchOnboardingOverview();
      },
    );

    const cleanJoinRequestReceived = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.JOIN_REQUEST_RECEIVED,
      async () => {
        triggerMembersRefresh();
        await fetchOnboardingOverview();
      },
    );

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

    const cleanJoinRequestRejected = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.IAM.JOIN_REQUEST_REJECTED,
      async () => {
        await fetchOnboardingOverview();
        triggerMembersRefresh();
      },
    );

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
      cleanShiftStatusChanged();
      cleanForceShiftHandover();
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
    setActiveShopContext,
    fetchOnboardingOverview,
    triggerMembersRefresh,
  ]);
};
