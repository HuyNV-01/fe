"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassModal,
  GlassIconButton,
  PatternButton,
  Switch,
} from "@/components/toolkit";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

export function CreatePollModal({
  open,
  onOpenChange,
  conversationId,
}: CreatePollModalProps) {
  const t = useTranslations("Chat.Detail.conversation.poll");
  const { createPoll } = useChatStore();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) {
      toast.warning(t("emptyQuestionWarning"));
      return;
    }
    if (validOptions.length < 2) {
      toast.warning(t("minOptionsWarning"));
      return;
    }

    setIsSubmitting(true);
    const ok = await createPoll({
      conversationId,
      question: question.trim(),
      options: validOptions,
      allowMultipleAnswers,
      isAnonymous,
    });
    setIsSubmitting(false);

    if (ok) {
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultipleAnswers(false);
      setIsAnonymous(false);
      onOpenChange(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <span>{t("createTitle")}</span>
        </span>
      }
      description={t("createDesc")}
      footer={
        <>
          <PatternButton
            type="button"
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </PatternButton>
          <PatternButton
            type="submit"
            form="create-poll-form"
            variant="solid"
            size="sm"
            rounded="full"
            isLoading={isSubmitting}
          >
            {t("submitCreate")}
          </PatternButton>
        </>
      }
    >
      <form id="create-poll-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/90">
            {t("questionLabel")} <span className="text-destructive">*</span>
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("questionPlaceholder")}
            maxLength={300}
            className="rounded-xl bg-background/60 text-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/90">
              {t("optionsLabel")} ({options.length}/10)
            </span>
            {options.length < 10 && (
              <PatternButton
                type="button"
                variant="ghost"
                color="primary"
                size="sm"
                rounded="full"
                onClick={handleAddOption}
                className="h-7 px-2 text-xs text-primary"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {t("addOption")}
              </PatternButton>
            )}
          </div>

          <ScrollArea className="max-h-48 pr-1">
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={t("optionPlaceholder", {
                      index: idx + 1,
                    })}
                    maxLength={150}
                    className="rounded-xl bg-background/60 text-xs h-9"
                  />
                  {options.length > 2 && (
                    <GlassIconButton
                      type="button"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      icon={<Trash2 className="w-4 h-4" />}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2.5 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">
              {t("allowMultipleLabel")}
            </span>
            <Switch
              checked={allowMultipleAnswers}
              onCheckedChange={setAllowMultipleAnswers}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{t("anonymousLabel")}</span>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
