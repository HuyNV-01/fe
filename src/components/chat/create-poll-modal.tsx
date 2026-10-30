"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiquidGlassModal } from "@/components/liquid-glass/liquid-glass";
import { PatternButton } from "@/components/button/button-patterns";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <LiquidGlassModal className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                <span>{t("createTitle")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("createDesc")}
              </DialogDescription>
            </DialogHeader>

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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-7 px-2 text-xs text-primary rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t("addOption")}
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-48 pr-1">
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
                        placeholder={t("optionPlaceholder", {
                          index: idx + 1,
                        })}
                        maxLength={150}
                        className="rounded-xl bg-background/60 text-xs h-9"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(idx)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <span className="text-xs font-medium">
                  {t("anonymousLabel")}
                </span>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
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
                variant="solid"
                size="sm"
                rounded="full"
                isLoading={isSubmitting}
              >
                {t("submitCreate")}
              </PatternButton>
            </DialogFooter>
          </form>
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
}