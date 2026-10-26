"use client";

import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTranslations } from "next-intl";

interface ContactEmptyStateProps {
  searchTerm: string;
}

export const ContactEmptyState = ({ searchTerm }: ContactEmptyStateProps) => {
  const t = useTranslations("Chat.Detail.contact.directory.empty");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20 px-4"
    >
      <Empty className="max-w-md mx-auto bg-transparent p-0">
        <EmptyHeader className="space-y-4">
          <EmptyMedia className="flex justify-center">
            <div className="p-4 rounded-full bg-muted/20 text-muted-foreground/50">
              {searchTerm ? (
                <Search className="size-10" />
              ) : (
                <Users className="size-10" />
              )}
            </div>
          </EmptyMedia>

          <div className="space-y-2">
            <EmptyTitle className="text-lg sm:text-xl font-semibold tracking-tight">
              {searchTerm ? t("noResultsTitle") : t("emptyTitle")}
            </EmptyTitle>

            <EmptyDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {searchTerm
                ? t("noResultsDesc", { keyword: searchTerm })
                : t("emptyDesc")}
            </EmptyDescription>
          </div>
        </EmptyHeader>
      </Empty>
    </motion.div>
  );
};
