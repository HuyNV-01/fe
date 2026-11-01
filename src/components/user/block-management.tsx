"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Search, ShieldCheck, ShieldOff } from "lucide-react";
import {
  GlassAvatar,
  GlassBadge,
  GlassConfirmDialog,
  GlassEmptyState,
  GlassSurfaceCard,
  PatternButton,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { IContactsDataRes } from "@/types/common";

interface BlockManagementProps {
  className?: string;
}

/**
 * Khu vực "Quản lý chặn" (Block Management):
 * Cho phép người dùng (User A) xem danh sách những người đã bị chặn, tìm kiếm nhanh
 * và thực hiện "Bỏ chặn" (Unblock) cập nhật tức thì trên toàn bộ ứng dụng qua Zustand.
 */
export const BlockManagement = ({ className }: BlockManagementProps) => {
  const t = useTranslations("Profile.blockManagement");
  const {
    blockedUsers,
    isLoadingBlocked,
    isRequest,
    fetchBlockedUsers,
    unblockUser,
  } = useContactStore();
  const { syncBlockStateForUser } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [unblockTarget, setUnblockTarget] = useState<IContactsDataRes | null>(
    null,
  );

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const filteredBlockedUsers = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    if (!keyword) return blockedUsers;

    return blockedUsers.filter((item) => {
      const name = (item.contactUser?.name || "").toLowerCase();
      const email = (item.contactUser?.email || "").toLowerCase();
      return name.includes(keyword) || email.includes(keyword);
    });
  }, [blockedUsers, debouncedQuery]);

  const handleConfirmUnblock = async () => {
    if (!unblockTarget) return;
    const targetId =
      unblockTarget.contactUser?.id || unblockTarget.contactId || "";
    if (!targetId) return;

    const ok = await unblockUser(targetId);
    if (ok) {
      syncBlockStateForUser(targetId, { blockedByMe: false });
      toast.success(
        t("unblockSuccess", {
          name: unblockTarget.contactUser?.name || t("defaultUser"),
        }),
      );
    } else {
      toast.error(t("unblockError"));
    }
    setUnblockTarget(null);
  };

  return (
    <>
      <GlassSurfaceCard
        className={className}
        header={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {t("title")}
                  </h3>
                  <GlassBadge variant="danger" size="sm">
                    {blockedUsers.length}
                  </GlassBadge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("description")}
                </p>
              </div>
            </div>

            {blockedUsers.length > 0 && (
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-8 pl-8 text-xs rounded-full bg-background/60"
                />
              </div>
            )}
          </div>
        }
      >
        {isLoadingBlocked && blockedUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("loading")}
          </div>
        ) : filteredBlockedUsers.length === 0 ? (
          <GlassEmptyState
            icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
            title={
              searchQuery.trim() ? t("emptySearchTitle") : t("emptyTitle")
            }
            description={
              searchQuery.trim() ? t("emptySearchDesc") : t("emptyDesc")
            }
            className="py-8"
          />
        ) : (
          <ScrollArea className="max-h-80 pr-1">
            <div className="space-y-2">
              {filteredBlockedUsers.map((item) => {
                const user = item.contactUser;
                const displayName = user?.name || t("defaultUser");

                return (
                  <div
                    key={item.id || item.contactId}
                    className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <GlassAvatar
                        src={user?.avatar}
                        name={displayName}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {displayName}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <PatternButton
                      size="sm"
                      variant="outline"
                      color="danger"
                      rounded="full"
                      disabled={isRequest}
                      icon={<ShieldOff className="w-3.5 h-3.5" />}
                      onClick={() => setUnblockTarget(item)}
                      className="shrink-0"
                    >
                      {t("unblockBtn")}
                    </PatternButton>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </GlassSurfaceCard>

      <GlassConfirmDialog
        open={Boolean(unblockTarget)}
        onOpenChange={(open) => !open && setUnblockTarget(null)}
        title={t("confirmUnblockTitle")}
        description={t("confirmUnblockDesc", {
          name: unblockTarget?.contactUser?.name || t("defaultUser"),
        })}
        confirmLabel={t("unblockBtn")}
        variant="primary"
        isLoading={isRequest}
        onConfirm={handleConfirmUnblock}
      />
    </>
  );
};
