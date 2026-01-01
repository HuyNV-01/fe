import { useMemo } from "react";
import type { IContactsDataRes } from "@/types/common";
import { getFirstLetter } from "../helper";

export type GroupedContacts = Record<string, IContactsDataRes[]>;

export const useGroupedContacts = (contacts: IContactsDataRes[]) => {
  return useMemo(() => {
    const groups: GroupedContacts = {};

    contacts.forEach((contact) => {
      const user = contact.contactUser || contact;
      const displayName = contact.alias || user.name || "";
      const letter = getFirstLetter(displayName);

      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });

    return { groups, sortedKeys };
  }, [contacts]);
};
