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
  type SearchResultItem,
} from "@/components/input/liquid-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "../ui/separator";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { DEFAULT_LIMIT_SEARCH, DEFAULT_PAGE } from "@/constant";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { ContactStatusEnum } from "@/common/enum";
import { Spinner } from "../ui/spinner";
import { PatternButton } from "../button/button-patterns";
import ButtonBack from "../button/button-back";
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
      <span className="text-xs font-medium text-emerald-500 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
        <UserCheck className="w-3.5 h-3.5" />
        <span>{t("friend")}</span>
      </span>
    );
  }

  if (contactStatus === ContactStatusEnum.PENDING_SENT) {
    return (
      <span className="text-xs font-medium text-amber-500 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        <span>{t("pendingSent")}</span>
      </span>
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

    const handleRemove = async (targetId: string) => {
      if (loadingId) return;

      setLoadingId(targetId);
      try {
        await removeContact({ data: { targetId } });
      } catch (error) {
        console.error("Failed to add friend", error);
      } finally {
        setLoadingId(null);
      }
    };

    return (
      <div className="flex items-center justify-between w-full p-1 group/row">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-10 w-10 border border-white/10 shadow-sm transition-transform group-hover/row:scale-105">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

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
            handleRemove={() => handleRemove(user.id)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-8 pt-5 space-y-5">
      <div className="flex flex-col gap-1 px-1 w-full">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <div className="md:hidden z-50">
            <ButtonBack />
          </div>
          <UserPlus className="w-5 h-5 text-primary" />
          {t("header.title.newContact")}
        </h2>

        <Separator className="mt-1" />
      </div>

      <div className="w-full">
        <div className=" group max-w-xl mx-auto">
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
    </div>
  );
}
