/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck, Clock, Sparkles } from "lucide-react";
import {
  LiquidSearch,
  GlassAvatar,
  GlassBadge,
  GlassSectionHeader,
  GlassConfirmDialog,
  PatternButton,
  type SearchResultItem,
} from "@/components/toolkit";
import { Separator } from "../ui/separator";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { DEFAULT_LIMIT_SEARCH, DEFAULT_PAGE } from "@/constant";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { ContactStatusEnum } from "@/common/enum";
import { Spinner } from "../ui/spinner";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useTranslations } from "next-intl";

export const ContactActionButton = ({
  contactStatus,
  onClick,
  isLoading,
  handleAccept,
  handleRemove,
}: {
  contactStatus: ContactStatusEnum;
  onClick: (e: React.MouseEvent) => void;
  isLoading?: boolean;
  handleAccept: () => void;
  handleRemove?: () => void;
}) => {
  const t = useTranslations("Chat.Detail.contact.contactStatus");
  if (isLoading) {
    return (
      <PatternButton size="icon" variant="ghost" disabled>
        <Spinner className="w-3.5 h-3.5" />
      </PatternButton>
    );
  }

  if (contactStatus === ContactStatusEnum.FRIEND) {
    return (
      <GlassBadge variant="success" size="md">
        <UserCheck className="w-3.5 h-3.5" />
        <span>{t("friend")}</span>
      </GlassBadge>
    );
  }

  if (contactStatus === ContactStatusEnum.PENDING_SENT) {
    return (
      <GlassBadge variant="warning" size="md">
        <Clock className="w-3.5 h-3.5" />
        <span>{t("pendingSent")}</span>
      </GlassBadge>
    );
  }

  if (contactStatus === ContactStatusEnum.PENDING_RECEIVED) {
    return (
      <div className="flex items-center space-x-1.5">
        {handleRemove && (
          <PatternButton
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            rounded={"full"}
          >
            {t("cancel")}
          </PatternButton>
        )}
        <PatternButton
          size="sm"
          variant="outline"
          onClick={handleAccept}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          rounded={"full"}
        >
          {t("accept")}
        </PatternButton>
      </div>
    );
  }

  return (
    <PatternButton
      size="sm"
      variant="ghost"
      onClick={onClick}
      icon={<UserPlus className="w-3.5 h-3.5" />}
      rounded={"full"}
    >
      {t("addFriend")}
    </PatternButton>
  );
};

export default function AddNewContact() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("Chat.Detail.contact");
  const {
    findContactUsers,
    resetContactUsers,
    requestContact,
    acceptFriend,
    removeContact,
    contacts,
    status,
  } = useContactStore();
  const isWait = useStoreWait(status);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleSelectItem = (id: string) => {
    router.push(`${config.routes.private.profile(id)}`);
  };
  useEffect(() => {
    if (contacts.data.length >= 0) {
      const mappedResults: SearchResultItem[] = contacts.data.map(
        (user) =>
          ({
            id: user.id,
            title: user.name,
            description: user.email,
            originalData: user,
            icon: null,
            onSelect: () => user.id && handleSelectItem(user.id),
          }) as SearchResultItem,
      );

      setResults(mappedResults);
    }
  }, [contacts]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      resetContactUsers();
      return;
    }

    findContactUsers({
      params: {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT_SEARCH,
        search: debouncedQuery,
      },
    });
  }, [debouncedQuery, findContactUsers, resetContactUsers]);

  const renderUserItem = (item: SearchResultItem) => {
    const user = item.originalData;

    const handleAddFriend = async (targetUserId: string) => {
      if (loadingId) return;

      setLoadingId(targetUserId);
      try {
        await requestContact({ data: { targetUserId } });
      } catch (error) {
        console.error("Failed to add friend", error);
      } finally {
        setLoadingId(null);
      }
    };

    const handleAccept = async (senderId: string) => {
      if (loadingId) return;

      setLoadingId(senderId);
      try {
        await acceptFriend({ data: { senderId } });
      } catch (error) {
        console.error("Failed to add friend", error);
      } finally {
        setLoadingId(null);
      }
    };

    return (
      <div className="flex items-center justify-between w-full p-1 group/row gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <GlassAvatar
            src={user.avatar}
            name={user.name}
            size="md"
            className="transition-transform group-hover/row:scale-105"
          />

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate font-mono opacity-80">
              {user.email}
            </span>
          </div>
        </div>

        <div
          className="ml-2 shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ContactActionButton
            contactStatus={user.contactStatus}
            isLoading={loadingId === user.id}
            onClick={(e) => {
              e.stopPropagation();
              handleAddFriend(user.id);
            }}
            handleAccept={() => handleAccept(user.id)}
            handleRemove={() =>
              setConfirmRemoveUser({ id: user.id, name: user.name })
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 sm:px-8 pt-4 sm:pt-5 space-y-5">
      <div className="flex flex-col gap-2 px-1 w-full">
        <GlassSectionHeader
          showBackOnMobile
          icon={<UserPlus className="w-5 h-5" />}
          title={t("header.title.newContact")}
        />
        <Separator className="mt-1" />
      </div>

      <div className="w-full">
        <div className="group max-w-xl mx-auto">
          <LiquidSearch
            mode="inline"
            value={query}
            onSearch={setQuery}
            results={results}
            loading={isWait}
            shouldFilter={false}
            maxHeight="400px"
            renderItem={renderUserItem}
            labels={{
              placeholder: t("form.placeholder.search"),
              emptyMessage: t("form.emptyMessage.search"),
              searching: t("form.searching"),
            }}
          />
        </div>
      </div>
      <GlassConfirmDialog
        open={Boolean(confirmRemoveUser)}
        onOpenChange={(open) => !open && setConfirmRemoveUser(null)}
        itemName={confirmRemoveUser?.name}
        isLoading={Boolean(loadingId)}
        onConfirm={async () => {
          if (!confirmRemoveUser) return;
          setLoadingId(confirmRemoveUser.id);
          try {
            await removeContact({ data: { targetId: confirmRemoveUser.id } });
          } finally {
            setLoadingId(null);
            setConfirmRemoveUser(null);
          }
        }}
      />
    </div>
  );
}
