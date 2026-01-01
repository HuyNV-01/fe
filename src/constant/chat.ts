import { ContactStatusEnum, KeyContactsEnum } from "@/common/enum";
import config from "@/config";
import type { IMenuItem } from "@/types/chat";
import type { TSidebarViewMode } from "@/types/common";
import {
  Contact,
  MessageCirclePlus,
  MessagesSquare,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export const VIEW_CONFIG = {
  CHAT: {
    labelKey: "chat",
    icon: MessagesSquare,
    targetRoute: config.routes.private.contacts,
    targetMode: "CONTACTS" as TSidebarViewMode,
    switchLabelKey: "contacts",
    switchIcon: Users,
  },
  CONTACTS: {
    labelKey: "contacts",
    icon: Users,
    targetRoute: config.routes.private.chat,
    targetMode: "CHAT" as TSidebarViewMode,
    switchLabelKey: "chat",
    switchIcon: MessagesSquare,
  },
};

export const MENU_GROUPS: { title?: string; items: IMenuItem[] }[] = [
  {
    title: "contact.sidebar.titleContacts",
    items: [
      {
        key: KeyContactsEnum.FRIENDS,
        label: "contact.sidebar.friendList",
        icon: Contact,
        href: config.routes.private.directory,
      },
      {
        key: KeyContactsEnum.GROUPS,
        label: "contact.sidebar.groupList",
        icon: UsersRound,
        href: "/contacts/groups",
      },
    ],
  },
  {
    title: "contact.sidebar.titleRequests",
    items: [
      {
        key: KeyContactsEnum.PENDING_RECEIVED,
        label: "contact.sidebar.friendRequests",
        icon: UserPlus,
        href: "/contacts/friend-requests",
        countKey: "friendRequests",
      },
      {
        key: KeyContactsEnum.GROUPS_RECEIVED,
        label: "contact.sidebar.groupRequests",
        icon: MessageCirclePlus,
        href: "/contacts/group-requests",
        countKey: "groupRequests",
      },
    ],
  },
];
