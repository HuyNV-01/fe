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

interface ContactEmptyStateProps {
  searchTerm: string;
}

export const ContactEmptyState = ({ searchTerm }: ContactEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="col-span-full flex flex-col items-center justify-center py-20"
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
            <EmptyTitle className="text-xl font-semibold tracking-tight">
              {searchTerm ? "Không tìm thấy kết quả" : "Danh bạ trống"}
            </EmptyTitle>

            <EmptyDescription className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {searchTerm
                ? `Không tìm thấy liên hệ nào phù hợp với từ khóa "${searchTerm}".`
                : "Bạn chưa có liên hệ nào trong danh sách này."}
            </EmptyDescription>
          </div>
        </EmptyHeader>
      </Empty>
    </motion.div>
  );
};
