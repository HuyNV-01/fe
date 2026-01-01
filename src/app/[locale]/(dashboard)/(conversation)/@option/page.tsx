"use client";

import ConversationOption from "@/components/chat/conversation-option";
import { DEFAULT_LIMIT_CONTACTS, DEFAULT_PAGE } from "@/constant";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import type { TOptionKey } from "@/types/chat";

export default function ConversationOptionPage() {
  const { getContacts } = useContactStore();
  const handleContactsFetch = async (key: TOptionKey) => {
    const typeKey = key;
    await getContacts({
      params: {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT_CONTACTS,
        type: typeKey,
      },
    });
  };
  return <ConversationOption onSelect={handleContactsFetch} />;
}
