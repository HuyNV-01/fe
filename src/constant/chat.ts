import { KeyContactsEnum } from "@/common/enum";
import config from "@/config";
import type { IMenuItem } from "@/types/chat";
import type { TSidebarViewMode } from "@/types/common";
import {
  Clock,
  Contact,
  MessagesSquare,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export const VIEW_CONFIG = {
  CHAT: {
    labelKey: "chat",
    icon: MessagesSquare,
    targetRoute: config.routes.private.directory,
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
        href: `${config.routes.private.directory}?tab=${KeyContactsEnum.FRIENDS}`,
      },
      {
        key: KeyContactsEnum.GROUPS,
        label: "contact.sidebar.groupList",
        icon: UsersRound,
        href: `${config.routes.private.directory}?tab=${KeyContactsEnum.GROUPS}`,
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
        href: `${config.routes.private.directory}?tab=${KeyContactsEnum.PENDING_RECEIVED}`,
        countKey: "friendRequests",
      },
      {
        key: KeyContactsEnum.PENDING_SENT,
        label: "contact.sidebar.groupRequests",
        icon: Clock,
        href: `${config.routes.private.directory}?tab=${KeyContactsEnum.PENDING_SENT}`,
        countKey: "groupRequests",
      },
    ],
  },
];
