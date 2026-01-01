"use client";

import * as React from "react";
import {
  Search,
  ArrowRight,
  LayoutGrid,
  Command as CommandIcon,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  LiquidGlassCard,
  LiquidGlassInput,
  LiquidGlassModal,
} from "../liquid-glass/liquid-glass";
import {
  LiquidPopover,
  LiquidPopoverContent,
  LiquidPopoverTrigger,
} from "../liquid-glass/liquid-popover";
import { LiquidGlassAnchor } from "../liquid-glass/liquid-glass-anchor";

// --- TYPES ---
export interface SearchResultItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  keywords?: string[];
  onSelect?: () => void;
  [key: string]: any;
}

export interface SearchGroup<T extends SearchResultItem = SearchResultItem> {
  heading?: string;
  items: T[];
}

export interface LiquidSearchLabels {
  placeholder?: string;
  emptyMessage?: React.ReactNode;
  searching?: string;
  navigate?: string;
  select?: string;
  close?: string;
  searchEngine?: string;
  clear?: string;
}

interface LiquidSearchProps<T extends SearchResultItem = SearchResultItem> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string;
  onSearch?: (value: string) => void;
  loading?: boolean;
  results?: T[] | SearchGroup<T>[];
  onItemSelect?: (item: T) => void;
  mode?: "command" | "inline" | "trigger" | "input";
  maxHeight?: string;
  placeholder?: string;
  emptyMessage?: React.ReactNode;
  className?: string;
  shortcut?: string;
  showShortcut?: boolean;
  shouldFilter?: boolean;
  clearable?: boolean;
  labels?: LiquidSearchLabels;
  renderItem?: (item: T) => React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

// --- SUB-COMPONENTS ---

const GlassKbd = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Kbd
    className={cn(
      "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border font-mono text-[10px] font-medium opacity-100",
      "border-white/20 px-1.5 shadow-sm backdrop-blur-md bg-white/5 text-muted-foreground",
      className,
    )}
  >
    {children}
  </Kbd>
);

// --- MAIN COMPONENT ---

export function LiquidSearch<T extends SearchResultItem = SearchResultItem>({
  open,
  onOpenChange,
  value = "",
  onSearch,
  onItemSelect,
  loading = false,
  results = [],
  mode = "command",
  className,
  renderItem,
  maxHeight = "350px",
  showShortcut = true,
  shouldFilter = false,
  clearable = true,
  labels = {},
  startIcon,
  endIcon,
  placeholder,
}: LiquidSearchProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isDialogOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const t = {
    placeholder: placeholder || labels.placeholder || "Type to search...",
    emptyMessage: labels.emptyMessage || "No results found.",
    searching: labels.searching || "Searching...",
    navigate: labels.navigate || "Navigate",
    select: labels.select || "Select",
    close: labels.close || "Close",
    searchEngine: labels.searchEngine || "Search Engine",
    clear: labels.clear || "Clear search",
  };

  React.useEffect(() => {
    if (mode !== "command") return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isDialogOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [mode, setOpen, isDialogOpen]);

  const normalizedGroups: SearchGroup<T>[] = React.useMemo(() => {
    if (!results || results.length === 0) return [];
    if (!("items" in results[0])) {
      return [{ heading: undefined, items: results as T[] }];
    }
    return results as SearchGroup<T>[];
  }, [results]);

  const handleSelect = React.useCallback(
    (item: T) => {
      item.onSelect?.();
      onItemSelect?.(item);
      if (mode === "command" || mode === "inline") {
        setOpen(false);
      }
    },
    [mode, onItemSelect, setOpen],
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSearch?.("");
      // e.currentTarget.parentElement?.querySelector('input')?.focus();
    },
    [onSearch],
  );

  const defaultRenderItem = (item: T) => (
    <div className="flex items-center w-full gap-3 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-aria-selected:bg-primary/10 group-aria-selected:text-primary transition-colors shrink-0">
        {item.icon || <Search className="h-4 w-4" />}
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="font-medium leading-none truncate text-foreground/90 group-aria-selected:text-foreground transition-colors">
          {item.title}
        </span>
        {item.description && (
          <span className="text-xs text-muted-foreground/70 truncate mt-1 group-aria-selected:text-muted-foreground">
            {item.description}
          </span>
        )}
      </div>
      <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-aria-selected:opacity-50 group-aria-selected:translate-x-0 transition-all duration-200 text-foreground/50" />
    </div>
  );

  const SearchContent = (
    <CommandList
      className="overflow-y-auto overflow-x-hidden custom-scrollbar p-2 focus:outline-none w-full"
      style={{ maxHeight }}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center w-full h-[120px] gap-2 animate-in fade-in duration-300">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <p className="text-xs text-muted-foreground/50 font-medium">
            {t.searching}
          </p>
        </div>
      )}

      {!loading && normalizedGroups.length === 0 && (
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground/80 flex flex-col items-center gap-3 w-full min-h-[120px] justify-center animate-in zoom-in-95 duration-200">
          <div className="p-3 rounded-full bg-muted/30 border border-white/10">
            <LayoutGrid className="h-6 w-6 opacity-40" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs">{t.emptyMessage}</p>
          </div>
        </CommandEmpty>
      )}

      {!loading &&
        normalizedGroups.map((group, idx) => (
          <React.Fragment key={group.heading || `group-${idx}`}>
            <CommandGroup
              heading={group.heading}
              className="text-foreground/70 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-muted-foreground/50 **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider"
            >
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={cn(
                    "group relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm outline-none transition-all duration-150 ease-out my-1",
                    "aria-selected:bg-accent/80 dark:aria-selected:bg-white/10 aria-selected:text-accent-foreground aria-selected:shadow-sm",
                    "hover:bg-accent/50 dark:hover:bg-white/5",
                  )}
                >
                  {renderItem ? renderItem(item) : defaultRenderItem(item)}
                </CommandItem>
              ))}
            </CommandGroup>
            {idx < normalizedGroups.length - 1 && (
              <CommandSeparator className="my-2 h-px bg-border/50" />
            )}
          </React.Fragment>
        ))}
    </CommandList>
  );

  // --- RENDER MODES ---
  // 1. INPUT MODE
  if (mode === "input") {
    return (
      <div className={cn("relative w-full group", className)}>
        <LiquidGlassAnchor className="h-full">
          <LiquidGlassInput className="w-full h-full! overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
            <div className="flex items-center px-3 w-full h-full">
              {startIcon || (
                <Search className="h-4 w-4 text-muted-foreground/50 mr-2 shrink-0" />
              )}

              <Input
                value={value}
                onChange={(e) => onSearch?.(e.target.value)}
                placeholder={t.placeholder}
                className={cn(
                  "flex h-full w-full py-2 text-sm",
                  "bg-transparent!",
                  "border-none",
                  "shadow-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "px-0",
                )}
              />

              <div className="flex items-center gap-1 shrink-0">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                ) : value && clearable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground"
                    aria-label={t.clear}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
                {endIcon}
              </div>
            </div>
          </LiquidGlassInput>
        </LiquidGlassAnchor>
      </div>
    );
  }

  // 2. TRIGGER MODE
  if (mode === "trigger") {
    return (
      <LiquidGlassInput
        className={cn(
          "group cursor-pointer hover:bg-white/10 transition-all duration-300 p-0 overflow-hidden",
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          className="relative h-12 w-full justify-start gap-3 px-4 text-sm font-normal text-muted-foreground/70 hover:bg-transparent hover:text-foreground transition-colors"
        >
          {startIcon || <Search className="h-4 w-4 opacity-50" />}
          <span className="flex-1 text-left opacity-70 truncate">
            {t.placeholder}
          </span>
          {showShortcut && (
            <div className="hidden sm:flex items-center gap-1 ml-auto">
              <GlassKbd>
                <span className="text-xs">⌘</span>K
              </GlassKbd>
            </div>
          )}
        </Button>
      </LiquidGlassInput>
    );
  }

  // 3. INLINE MODE
  if (mode === "inline") {
    const showInlineDropdown = isDialogOpen && (value.length > 0 || loading);

    return (
      <div className={cn("relative w-full group z-50", className)}>
        <Command
          shouldFilter={shouldFilter}
          className="bg-transparent border-none shadow-none overflow-visible w-full"
        >
          <LiquidPopover open={showInlineDropdown} onOpenChange={setOpen}>
            <LiquidGlassAnchor>
              <LiquidPopoverTrigger asChild>
                <LiquidGlassInput className="w-full overflow-visible focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-0">
                  <div className="flex items-center px-3 w-full">
                    {startIcon || (
                      <Search className="h-4 w-4 text-muted-foreground/50 mr-2 shrink-0" />
                    )}

                    <CommandInput
                      value={value}
                      onValueChange={(val) => {
                        onSearch?.(val);
                        if (!isDialogOpen) setOpen(true);
                      }}
                      placeholder={t.placeholder}
                      useIcon={false}
                      className={cn(
                        "flex w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0 h-10 py-2 shadow-none",
                      )}
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      {loading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                      )}
                      {!loading && value && clearable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            handleClear(e);
                          }}
                          className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground"
                          aria-label={t.clear}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {endIcon}
                    </div>
                  </div>
                </LiquidGlassInput>
              </LiquidPopoverTrigger>
            </LiquidGlassAnchor>

            <LiquidPopoverContent className="z-50 w-[var(--radix-popover-trigger-width)] p-0 border-none bg-transparent shadow-none">
              <LiquidGlassCard
                blur="md"
                className="p-0 overflow-hidden border border-white/10 shadow-xl"
              >
                {SearchContent}
              </LiquidGlassCard>
            </LiquidPopoverContent>
          </LiquidPopover>
        </Command>
      </div>
    );
  }

  // 4. COMMAND MODE (Dialog)
  return (
    <Dialog open={isDialogOpen} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogContent
        className={cn(
          "p-0 bg-transparent border-none shadow-none gap-0",
          "w-full h-full sm:h-auto sm:max-w-3xl sm:w-[90vw]",
          "top-0 translate-y-0 sm:top-[15%]",
        )}
        showCloseButton={false}
      >
        <LiquidGlassModal
          opacity="60"
          blur="sm"
          className="overflow-hidden p-0 flex flex-col shadow-2xl border border-white/10"
        >
          <Command
            shouldFilter={shouldFilter}
            className="bg-transparent flex flex-col h-full"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 h-14 shrink-0 bg-white/5">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-5 w-5 text-muted-foreground/50" />
                <CommandInput
                  value={value}
                  onValueChange={onSearch}
                  placeholder={t.placeholder}
                  useIcon={false}
                  className="flex h-full w-full bg-transparent text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0 shadow-none"
                />
              </div>
              <div className="flex items-center gap-2 pl-2">
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50 mr-2" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent rounded-md transition-colors"
                >
                  <GlassKbd className="bg-transparent border-white/20 text-[10px]">
                    ESC
                  </GlassKbd>
                </Button>
              </div>
            </div>

            {SearchContent}

            <div className="hidden md:flex items-center justify-between border-t border-white/10 bg-white/5 px-4 h-9 shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/70">
                <CommandIcon className="w-3 h-3" />
                <span>{t.searchEngine}</span>
              </div>

              <div className="text-[10px] text-muted-foreground/60 flex gap-3">
                <span className="flex items-center gap-1.5 ">
                  <GlassKbd className="h-4 px-1 text-[9px] bg-white/5 border-white/10">
                    ↑↓
                  </GlassKbd>
                  {t.navigate}
                </span>
                <span className="flex items-center gap-1.5 ">
                  <GlassKbd className="h-4 px-1 text-[9px] bg-white/5 border-white/10">
                    ↵
                  </GlassKbd>
                  {t.select}
                </span>
              </div>
            </div>
          </Command>
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
}
