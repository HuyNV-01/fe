"use client";

import ConversationOption from "@/components/chat/conversation-option";
import { KeyContactsEnum } from "@/common/enum";
import { DEFAULT_LIMIT_CONTACTS, DEFAULT_PAGE } from "@/constant";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import type { TOptionKey } from "@/types/chat";

export default function ConversationOptionPage() {
  const { getContacts } = useContactStore();
  const { fetchInbox } = useChatStore();

  const handleContactsFetch = async (key: TOptionKey) => {
    if (
      key === KeyContactsEnum.GROUPS ||
      key === KeyContactsEnum.GROUPS_RECEIVED
    ) {
      await fetchInbox({ page: DEFAULT_PAGE, limit: 100 });
      return;
    }

    await getContacts({
      params: {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT_CONTACTS,
        type: key,
      },
    });
  };
  return <ConversationOption onSelect={handleContactsFetch} />;
}
