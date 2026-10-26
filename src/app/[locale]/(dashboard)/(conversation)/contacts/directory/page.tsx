"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  LiquidGlass,
  LiquidGlassCard,
} from "@/components/liquid-glass/liquid-glass";
import { ContactItem } from "@/components/contacts/contact-item";
import {
  ConversationTypeEnum,
  KeyContactsEnum,
  SortTypeEnum,
} from "@/common/enum";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { useGroupedContacts } from "@/utils/hooks/use-grouped-contacts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactListSkeleton } from "@/components/skeleton/contact-list-skeleton";
import { ContactEmptyState } from "@/components/contacts/contact-empty-state";
import { LiquidSearch } from "@/components/input/liquid-search";
import { CreateGroupModal } from "@/components/chat/create-group-modal";
import { PatternButton } from "@/components/button/button-patterns";
import ButtonBack from "@/components/button/button-back";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Clock,
  Contact,
  MessageCircle,
  Plus,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Select, SelectValue } from "@/components/ui/select";
import ContentSelect from "@/components/select/select-content";
import ItemSelect from "@/components/select/select-item";
import TriggerSelect from "@/components/select/select-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/helper";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import config from "@/config";
import type { TSort } from "@/types";

export default function DirectoryPage() {
  const router = useRouter();
  const t = useTranslations("Chat.Detail.contact.directory");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as KeyContactsEnum | null;

  const { listContacts, getContacts, status } = useContactStore();
  const { conversations, fetchInbox } = useChatStore();
  const isFetching = useStoreWait([status]);

  const [activeTab, setActiveTab] = useState<KeyContactsEnum>(
    tabParam || KeyContactsEnum.FRIENDS,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const isTyping = searchTerm !== debouncedSearch;
  const [sortOrder, setSortOrder] = useState<TSort>(SortTypeEnum.ASC);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const directoryTabs = useMemo(
    () => [
      {
        key: KeyContactsEnum.FRIENDS,
        label: t("tabs.friends"),
        icon: Contact,
      },
      {
        key: KeyContactsEnum.PENDING_RECEIVED,
        label: t("tabs.pendingReceived"),
        icon: UserPlus,
      },
      {
        key: KeyContactsEnum.PENDING_SENT,
        label: t("tabs.pendingSent"),
        icon: Clock,
      },
      {
        key: KeyContactsEnum.GROUPS,
        label: t("tabs.groups"),
        icon: UsersRound,
      },
    ],
    [t],
  );

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const refreshData = useCallback(() => {
    if (activeTab === KeyContactsEnum.GROUPS) {
      fetchInbox({ page: 1, limit: 100 });
      return;
    }

    getContacts({
      params: {
        page: 1,
        limit: 100,
        type: activeTab,
        search: debouncedSearch || undefined,
        sort: `name:${sortOrder}`,
      },
    });
  }, [activeTab, debouncedSearch, getContacts, fetchInbox, sortOrder]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const groupConversations = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    const list = conversations.filter(
      (c) => c.type === ConversationTypeEnum.GROUP,
    );
    const filtered = keyword
      ? list.filter((c) => (c.name || "").toLowerCase().includes(keyword))
      : list;

    return [...filtered].sort((a, b) => {
      const cmp = (a.name || "").localeCompare(b.name || "");
      return sortOrder === SortTypeEnum.ASC ? cmp : -cmp;
    });
  }, [conversations, debouncedSearch, sortOrder]);

  const { groups, sortedKeys } = useGroupedContacts(listContacts.data);
  const displayKeys =
    sortOrder === SortTypeEnum.ASC ? sortedKeys : [...sortedKeys].reverse();

  const isGroupsTab = activeTab === KeyContactsEnum.GROUPS;
  const hasData = isGroupsTab
    ? groupConversations.length > 0
    : listContacts.data.length > 0;
  const isProcessing = isFetching || isTyping;
  const showSkeleton = isProcessing && !hasData && !isGroupsTab;
  const showDataList = hasData;
  const showEmptyState = !isProcessing && !hasData;

  const currentTabMeta =
    directoryTabs.find((tab) => tab.key === activeTab) || directoryTabs[0];
  const HeaderIcon = currentTabMeta.icon;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header cố định trên cùng */}
      <div className="flex-none z-20 px-3.5 sm:px-6 pt-3.5 sm:pt-4 pb-3 border-b border-border/50 bg-background/85 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="md:hidden shrink-0">
              <ButtonBack />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0">
                <HeaderIcon className="h-5 w-5" />
              </div>

              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {currentTabMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isGroupsTab ? (
              <PatternButton
                size="sm"
                variant="solid"
                rounded="full"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsGroupModalOpen(true)}
              >
                {t("actions.createGroup")}
              </PatternButton>
            ) : (
              <PatternButton
                size="sm"
                variant="glass"
                color="primary"
                rounded="full"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => router.push(config.routes.private.addNew)}
              >
                {t("actions.addFriend")}
              </PatternButton>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm & sắp xếp */}
        <div className="flex items-center justify-between gap-2 w-full">
          <LiquidSearch
            mode="input"
            placeholder={
              isGroupsTab
                ? t("search.groupsPlaceholder")
                : t("search.contactsPlaceholder")
            }
            value={searchTerm}
            onSearch={setSearchTerm}
            loading={isProcessing && searchTerm.length > 0}
            clearable
            maxHeight="400px"
            className="flex-1 min-w-0"
          />

          <Select
            value={sortOrder}
            onValueChange={(val) => setSortOrder(val as TSort)}
          >
            <TriggerSelect>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <SelectValue placeholder={t("sort.placeholder")} />
              </div>
            </TriggerSelect>

            <ContentSelect align="end">
              <ItemSelect
                value={SortTypeEnum.ASC}
                icon={<ArrowDownAZ className="h-4 w-4" />}
              >
                <span>{t("sort.nameAsc")}</span>
              </ItemSelect>
              <ItemSelect
                value={SortTypeEnum.DESC}
                icon={<ArrowUpZA className="h-4 w-4" />}
              >
                <span>{t("sort.nameDesc")}</span>
              </ItemSelect>
            </ContentSelect>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="w-full mx-auto space-y-6 py-4 px-3.5 sm:px-6 pb-20">
          {showSkeleton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ContactListSkeleton />
            </motion.div>
          )}

          {showDataList && isGroupsTab && (
            <div className="grid grid-cols-1 gap-2.5">
              {groupConversations.map((group) => (
                <LiquidGlassCard
                  key={group.id}
                  interactive
                  hover
                  isolate={false}
                  className="p-2.5 sm:p-3"
                  onClick={() =>
                    router.push(config.routes.private.detailChat(group.id))
                  }
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border border-border/50 shrink-0">
                        <AvatarImage
                          src={group.avatar || undefined}
                          alt={group.name}
                        />
                        <AvatarFallback className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                          {getInitials(group.name || "GR")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {group.name || t("groupItem.defaultName")}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {group.lastMessage || t("groupItem.clickToOpen")}
                        </p>
                      </div>
                    </div>

                    <PatternButton
                      size="icon"
                      variant="glass"
                      rounded="full"
                      className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </PatternButton>
                  </div>
                </LiquidGlassCard>
              ))}
            </div>
          )}

          {showDataList && !isGroupsTab && (
            <motion.div
              className="space-y-6"
              animate={{ opacity: isProcessing ? 0.6 : 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {displayKeys.map((letter) => (
                  <motion.div
                    key={letter}
                    layout="position"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.25,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="space-y-2.5"
                  >
                    <div className="sticky top-2 z-10 flex items-center pointer-events-none">
                      <LiquidGlass
                        variant="accent"
                        blur="md"
                        rounded="full"
                        fluid={false}
                        isolate={false}
                        className="px-3.5 py-1 text-xs font-bold text-primary border border-primary/20 shadow-xs"
                      >
                        {letter}
                      </LiquidGlass>
                    </div>

                    <div className="flex flex-col gap-2">
                      {groups[letter].map((contact) => (
                        <ContactItem key={contact.id} contact={contact} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {showEmptyState && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ContactEmptyState searchTerm={searchTerm} />
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <CreateGroupModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        mode="create"
      />
    </div>
  );
}
