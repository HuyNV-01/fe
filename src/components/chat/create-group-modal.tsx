"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, UsersRound, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PatternButton } from "@/components/button/button-patterns";
import { LiquidGlassModal } from "@/components/liquid-glass/liquid-glass";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { KeyContactsEnum } from "@/common/enum";
import { getInitials } from "@/utils/helper";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { toast } from "sonner";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "add-members";
  conversationId?: string;
  groupName?: string;
}

export function CreateGroupModal({
  open,
  onOpenChange,
  mode = "create",
  conversationId,
  groupName: existingGroupName,
}: CreateGroupModalProps) {
  const router = useRouter();
  const { listContacts, getContacts } = useContactStore();
  const { createGroupChat, addGroupMembers } = useChatStore();

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      getContacts({
        params: {
          page: 1,
          limit: 100,
          type: KeyContactsEnum.FRIENDS,
        },
      });
    } else {
      setName("");
      setSearch("");
      setSelectedIds([]);
      setIsSubmitting(false);
    }
  }, [open, getContacts]);

  const friends = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (listContacts.data || []).filter((item) => {
      const user = item.contactUser;
      if (!user?.id) return false;
      if (!keyword) return true;
      const displayName = (item.alias || user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return displayName.includes(keyword) || email.includes(keyword);
    });
  }, [listContacts.data, search]);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mode === "create") {
      if (!name.trim()) {
        toast.warning("Vui lòng nhập tên nhóm trò chuyện");
        return;
      }
      if (selectedIds.length === 0) {
        toast.warning("Vui lòng chọn ít nhất 1 thành viên");
        return;
      }

      setIsSubmitting(true);
      const newGroupId = await createGroupChat({
        name: name.trim(),
        memberIds: selectedIds,
      });
      setIsSubmitting(false);

      if (newGroupId) {
        onOpenChange(false);
        router.push(config.routes.private.detailChat(newGroupId));
      }
    } else if (mode === "add-members" && conversationId) {
      if (selectedIds.length === 0) {
        toast.warning("Vui lòng chọn ít nhất 1 thành viên cần thêm");
        return;
      }

      setIsSubmitting(true);
      const ok = await addGroupMembers({
        conversationId,
        memberIds: selectedIds,
      });
      setIsSubmitting(false);

      if (ok) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none sm:max-w-md">
        <LiquidGlassModal className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                {mode === "create" ? (
                  <>
                    <UsersRound className="w-5 h-5 text-primary" />
                    <span>Tạo nhóm trò chuyện mới</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-primary" />
                    <span>Thêm thành viên vào nhóm</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {mode === "create"
                  ? "Đặt tên nhóm và chọn bạn bè từ danh bạ để bắt đầu cuộc trò chuyện nhóm."
                  : `Chọn bạn bè để thêm vào nhóm "${existingGroupName || "Trò chuyện nhóm"}".`}
              </DialogDescription>
            </DialogHeader>

            {mode === "create" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="group-name-input"
                  className="text-xs font-semibold text-foreground/90"
                >
                  Tên nhóm <span className="text-destructive">*</span>
                </label>
                <Input
                  id="group-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên nhóm (VD: Team Dự Án)..."
                  maxLength={120}
                  className="rounded-xl bg-background/60"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground/90">
                  Chọn thành viên ({selectedIds.length} đã chọn)
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bạn bè theo tên hoặc email..."
                  className="pl-9 rounded-xl bg-background/60 h-9 text-xs"
                />
              </div>

              <ScrollArea className="h-56 rounded-xl border border-border/50 bg-background/40 p-2">
                {friends.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground">
                    Không tìm thấy bạn bè nào trong danh bạ.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friends.map((contact) => {
                      const user = contact.contactUser;
                      const userId = user.id || contact.contactId;
                      const displayName =
                        contact.alias || user.name || "Người dùng";
                      const isSelected = selectedIds.includes(userId);

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => toggleMember(userId)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/60 border border-transparent",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Avatar className="h-8 w-8 border shrink-0">
                              <AvatarImage
                                src={user.avatar || undefined}
                                alt={displayName}
                              />
                              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">
                                {displayName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <PatternButton
                type="button"
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </PatternButton>
              <PatternButton
                type="submit"
                variant="solid"
                size="sm"
                rounded="full"
                isLoading={isSubmitting}
                disabled={
                  isSubmitting ||
                  selectedIds.length === 0 ||
                  (mode === "create" && !name.trim())
                }
              >
                {mode === "create" ? "Tạo nhóm" : "Thêm thành viên"}
              </PatternButton>
            </DialogFooter>
          </form>
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
}
