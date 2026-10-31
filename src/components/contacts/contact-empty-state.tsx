"use client";

import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { GlassEmptyState } from "@/components/toolkit";
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
      className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 px-4"
    >
      <GlassEmptyState
        icon={
          searchTerm ? (
            <Search className="size-8" />
          ) : (
            <Users className="size-8" />
          )
        }
        title={searchTerm ? t("noResultsTitle") : t("emptyTitle")}
        description={
          searchTerm
            ? t("noResultsDesc", { keyword: searchTerm })
            : t("emptyDesc")
        }
        className="max-w-md mx-auto"
      />
    </motion.div>
  );
};
