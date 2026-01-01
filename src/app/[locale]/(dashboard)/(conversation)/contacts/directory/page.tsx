"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  LiquidGlass,
  LiquidGlassNavigation,
} from "@/components/liquid-glass/liquid-glass";
import { ContactItem } from "@/components/contacts/contact-item";
import { KeyContactsEnum, SortTypeEnum } from "@/common/enum";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { useGroupedContacts } from "@/utils/hooks/use-grouped-contacts";
import { LiquidGlassAnchor } from "@/components/liquid-glass/liquid-glass-anchor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactListSkeleton } from "@/components/skeleton/contact-list-skeleton";
import { ContactEmptyState } from "@/components/contacts/contact-empty-state";
import { LiquidSearch } from "@/components/input/liquid-search";
import ButtonBack from "@/components/button/button-back";
import { ArrowDownAZ, ArrowUpZA, Contact } from "lucide-react";
import { Select, SelectValue } from "@/components/ui/select";
import ContentSelect from "@/components/select/select-content";
import ItemSelect from "@/components/select/select-item";
import TriggerSelect from "@/components/select/select-trigger";
import type { TSort } from "@/types";

export default function DirectoryPage() {
  const { listContacts, getContacts, status } = useContactStore();
  const isFetching = useStoreWait([status]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const isTyping = searchTerm !== debouncedSearch;
  const [sortOrder, setSortOrder] = useState<TSort>(SortTypeEnum.ASC);

  const refreshData = useCallback(() => {
    getContacts({
      params: {
        page: 1,
        limit: 100,
        type: KeyContactsEnum.FRIENDS,
        search: debouncedSearch || undefined,
        sort: `name:${sortOrder}`,
      },
    });
  }, [debouncedSearch, getContacts, sortOrder]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const { groups, sortedKeys } = useGroupedContacts(listContacts.data);
  const displayKeys =
    sortOrder === SortTypeEnum.ASC ? sortedKeys : [...sortedKeys].reverse();
  const hasData = listContacts.data.length > 0;
  const isProcessing = isFetching || isTyping;
  const showSkeleton = isProcessing && !hasData;
  const showDataList = hasData;
  const showEmptyState = !isProcessing && !hasData;
  return (
    <div className="h-full w-full">
      <ScrollArea className="w-full h-full">
        <div className="sticky top-0 w-full mb-5 z-20 pointer-events-none">
          <LiquidGlassAnchor>
            <LiquidGlassNavigation
              rounded="none"
              border="none"
              shadow="none"
              className="rounded-tr-2xl px-4 pt-4 pb-12 backdrop-blur-xl bg-linear-to-b from-background/90 via-background/60 to-transparent"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 60%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 60%, transparent 100%)",
              }}
            >
              <div className="flex flex-col gap-4 w-full pointer-events-auto">
                <div className="flex items-center gap-3 md:gap-4 select-none">
                  <div className="md:hidden z-50 shrink-0">
                    <ButtonBack />
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="hidden md:flex items-center justify-center h-10 w-10 ">
                      <Contact className="h-5 w-5" />
                    </div>
                    <Contact className="md:hidden h-6 w-6 text-primary/80 shrink-0" />

                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70 truncate">
                      Danh bạ
                    </h1>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 w-full">
                  <LiquidSearch
                    mode="input"
                    placeholder="Tìm kiếm bạn bè..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    loading={isProcessing && searchTerm.length > 0}
                    clearable
                    className="max-w-xl"
                  />

                  <Select
                    value={sortOrder}
                    onValueChange={(val) => setSortOrder(val as TSort)}
                  >
                    <TriggerSelect>
                      <div className="flex items-center gap-2">
                        <SelectValue placeholder="Sắp xếp" />
                      </div>
                    </TriggerSelect>

                    <ContentSelect align="end">
                      <ItemSelect
                        value={SortTypeEnum.ASC}
                        icon={<ArrowDownAZ className="h-4 w-4" />}
                      >
                        <span>Tên (A-Z)</span>
                      </ItemSelect>
                      <ItemSelect
                        value={SortTypeEnum.DESC}
                        icon={<ArrowUpZA className="h-4 w-4" />}
                      >
                        <span>Tên (Z-A)</span>
                      </ItemSelect>
                    </ContentSelect>
                  </Select>
                </div>
              </div>
            </LiquidGlassNavigation>
          </LiquidGlassAnchor>
        </div>

        <div className="w-full h-full mx-auto space-y-8 pb-20 px-4 -mt-6 min-h-[50vh]">
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

          {showDataList && (
            <motion.div
              className="space-y-8"
              animate={{ opacity: isProcessing ? 0.5 : 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {displayKeys.map((letter) => (
                  <motion.div
                    key={letter}
                    layout="position"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="space-y-4"
                  >
                    <div className="sticky top-36 z-10 flex items-center">
                      <LiquidGlassAnchor zIndex={10}>
                        <LiquidGlass
                          variant="accent"
                          blur="md"
                          rounded="full"
                          className="px-4 py-1.5 text-sm font-bold text-primary w-max border border-white/10 shadow-sm"
                        >
                          {letter}
                        </LiquidGlass>
                      </LiquidGlassAnchor>
                    </div>

                    <div className="flex flex-col">
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
    </div>
  );
}
