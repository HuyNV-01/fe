"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GlassBadge,
  LiquidPopover,
  LiquidPopoverContent,
  LiquidPopoverTrigger,
  PatternButton,
  useGlassNestingLevel,
} from "@/components/toolkit";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  VN_CURRENT_34_ADMINISTRATIVE_UNITS_TREE,
  VN_FULL_ADMINISTRATIVE_UNITS_TREE,
} from "@/constant/vn-administrative-units";
import type {
  IVnDistrictUnit,
  IVnHamletUnit,
  IVnProvinceUnit,
  IVnWardUnit,
} from "@/types/crm";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Layers,
  MapPin,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu phục vụ tìm kiếm tức thời Tỉnh/Huyện/Xã/Thôn trong Command (cmdk)
 */
function normalizeVietnameseSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra cây hành chính truyền từ store có đầy đủ chuẩn 63 tỉnh & >= 700 Quận/Huyện toàn quốc hay chưa
 * nhằm tránh trường hợp localStorage lưu bản rút gọn cũ.
 */
function isCompleteAdministrativeTree(
  tree?: IVnProvinceUnit[] | null,
): boolean {
  if (!Array.isArray(tree) || tree.length < 63) return false;
  let totalDistricts = 0;
  for (const prov of tree) {
    totalDistricts += Array.isArray(prov.districts) ? prov.districts.length : 0;
  }
  return totalDistricts >= 700;
}

export interface ProvinceDistrictWardComboboxProps {
  administrativeTree?: IVnProvinceUnit[];
  provinceCode?: string | null;
  districtCode?: string | null;
  wardCode?: string | null;
  hamletCode?: string | null;
  hamletName?: string | null;
  defaultTierMode?: "3_TIER" | "4_TIER";
  onChange: (value: {
    provinceCode: string | null;
    provinceName: string | null;
    districtCode: string | null;
    districtName: string | null;
    wardCode: string | null;
    wardName: string | null;
    hamletCode?: string | null;
    hamletName?: string | null;
  }) => void;
}

export function ProvinceDistrictWardCombobox({
  administrativeTree,
  provinceCode,
  districtCode,
  wardCode,
  hamletCode,
  hamletName,
  defaultTierMode = "3_TIER",
  onChange,
}: ProvinceDistrictWardComboboxProps) {
  const t = useTranslations("Crm360.addressSelector");
  const nestingLevel = useGlassNestingLevel();
  const isOverGlass = nestingLevel > 0;

  // Duy nhất 1 thanh chuyển đổi chế độ hành chính:
  // - 3_TIER: Nhận diện 3 cấp chính toàn quốc (34 Tỉnh/Thành hiện tại sau sáp nhập, gộp đủ 703 Quận/Huyện & 3.756+ Phường/Xã/Đặc khu)
  // - 4_TIER: Nhận diện 4 cấp hành chính đầy đủ cho toàn bộ 63 Tỉnh/Thành trước đó (Tỉnh -> Quận/Huyện -> Phường/Xã -> Thôn/Ấp/Bản/Khu phố/TDP)
  const [tierMode, setTierMode] = useState<"3_TIER" | "4_TIER">(() =>
    hamletCode || hamletName ? "4_TIER" : defaultTierMode,
  );

  // Tự động bật sang tab 4 Cấp khi NER bóc tách được Thôn/Ấp/Bản/Khu phố/Tổ dân phố từ tin nhắn
  useEffect(() => {
    if (hamletCode || hamletName) {
      setTierMode("4_TIER");
    }
  }, [hamletCode, hamletName]);

  const [openProv, setOpenProv] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openWard, setOpenWard] = useState(false);
  const [openHamlet, setOpenHamlet] = useState(false);

  const [wardSearchInput, setWardSearchInput] = useState("");
  const [hamletSearchInput, setHamletSearchInput] = useState("");

  // Cây 63 Tỉnh/Thành đầy đủ (dùng cho chế độ 4 Cấp Hành Chính)
  const full63Tree = useMemo<IVnProvinceUnit[]>(() => {
    if (isCompleteAdministrativeTree(administrativeTree)) {
      return administrativeTree!;
    }
    return VN_FULL_ADMINISTRATIVE_UNITS_TREE;
  }, [administrativeTree]);

  // Cây 34 Tỉnh/Thành hiện tại sau sáp nhập (dùng cho chế độ 3 Cấp Hành Chính)
  const current34Tree = useMemo<IVnProvinceUnit[]>(() => {
    return VN_CURRENT_34_ADMINISTRATIVE_UNITS_TREE;
  }, []);

  // Cây tỉnh thành đang kích hoạt tương ứng với tab 3 Cấp (34 tỉnh) hoặc 4 Cấp (63 tỉnh)
  const effectiveTree = useMemo<IVnProvinceUnit[]>(
    () => (tierMode === "3_TIER" ? current34Tree : full63Tree),
    [tierMode, current34Tree, full63Tree],
  );

  // Tìm tỉnh gốc trong bộ 63 tỉnh dựa trên districtCode (ưu tiên cao nhất khi chuyển qua lại giữa 3 cấp & 4 cấp) hoặc provinceCode
  const rawLegacyProvince = useMemo<IVnProvinceUnit | null>(() => {
    if (districtCode) {
      const byDistrict = full63Tree.find((p) =>
        p.districts.some((d) => d.code === districtCode),
      );
      if (byDistrict) return byDistrict;
    }
    if (provinceCode) {
      const byCode = full63Tree.find((p) => p.code === provinceCode);
      if (byCode) return byCode;
    }
    return null;
  }, [full63Tree, provinceCode, districtCode]);

  // Tỉnh/Thành đang hiển thị trên combobox Cấp 1 theo đúng chế độ 3 Cấp hoặc 4 Cấp
  const selectedProvince = useMemo<IVnProvinceUnit | null>(() => {
    if (!provinceCode && !rawLegacyProvince) return null;

    if (tierMode === "3_TIER") {
      if (provinceCode) {
        const direct34 = current34Tree.find((p) => p.code === provinceCode);
        if (direct34) return direct34;
      }
      if (rawLegacyProvince) {
        const mergedTargetCode =
          rawLegacyProvince.mergedIntoProvinceCode || rawLegacyProvince.code;
        return (
          current34Tree.find((p) => p.code === mergedTargetCode) ||
          rawLegacyProvince
        );
      }
      return null;
    }

    // Chế độ 4_TIER (63 Tỉnh/Thành trước sáp nhập)
    if (rawLegacyProvince) {
      return rawLegacyProvince;
    }
    if (provinceCode) {
      return full63Tree.find((p) => p.code === provinceCode) || null;
    }
    return null;
  }, [tierMode, provinceCode, rawLegacyProvince, current34Tree, full63Tree]);

  const districts = useMemo<IVnDistrictUnit[]>(
    () => selectedProvince?.districts || [],
    [selectedProvince],
  );

  const selectedDistrict = useMemo<IVnDistrictUnit | null>(() => {
    if (!districtCode) return null;
    return (
      districts.find((d) => d.code === districtCode) ||
      rawLegacyProvince?.districts.find((d) => d.code === districtCode) ||
      null
    );
  }, [districts, districtCode, rawLegacyProvince]);

  const wards = useMemo<IVnWardUnit[]>(
    () => selectedDistrict?.wards || [],
    [selectedDistrict],
  );

  const selectedWard = useMemo<IVnWardUnit | null>(() => {
    if (!wardCode) return null;
    const matched = wards.find((w) => w.code === wardCode);
    if (matched) return matched;
    if (wardCode.startsWith("CUSTOM-WARD:")) {
      const customName = wardCode.replace("CUSTOM-WARD:", "");
      return {
        code: wardCode,
        name: customName,
        aliases: [normalizeVietnameseSearchText(customName)],
        ghnWardCode: "00000",
        ghtkWardName: customName,
        vtpWardId: 0,
        hamlets: [],
      };
    }
    return null;
  }, [wards, wardCode]);

  const hamlets = useMemo<IVnHamletUnit[]>(
    () => selectedWard?.hamlets || [],
    [selectedWard],
  );

  const selectedHamlet = useMemo<IVnHamletUnit | null>(() => {
    if (hamletCode) {
      const found = hamlets.find((h) => h.code === hamletCode);
      if (found) return found;
    }
    if (hamletName) {
      return {
        code: hamletCode || "CUSTOM-HAMLET",
        name: hamletName,
        unitType: "THON" as const,
        aliases: [normalizeVietnameseSearchText(hamletName)],
        ghtkHamletName: hamletName,
      };
    }
    return null;
  }, [hamlets, hamletCode, hamletName]);

  const isFourTierMode = tierMode === "4_TIER";

  return (
    <div className="space-y-2">
      {/* Duy nhất 1 thanh Tab chuyển đổi: 3 Cấp Hành Chính (34 Tỉnh/Thành hiện tại) vs 4 Cấp Hành Chính (63 Tỉnh/Thành đầy đủ) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted/50 p-0.5 border border-border/50">
          <button
            type="button"
            onClick={() => setTierMode("3_TIER")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1",
              tierMode === "3_TIER"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>
              {t("mode3TierBtn")} ({current34Tree.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTierMode("4_TIER")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1",
              tierMode === "4_TIER"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>
              {t("mode4TierBtn")} ({full63Tree.length})
            </span>
          </button>
        </div>

        <span className="text-[10px] text-muted-foreground">
          {isFourTierMode ? t("mode4TierScopeHint") : t("mode3TierScopeHint")}
        </span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          isFourTierMode ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {/* Cấp 1: Chọn Tỉnh / Thành phố */}
        <LiquidPopover
          open={openProv}
          onOpenChange={setOpenProv}
          matchWidth={false}
          placement="bottom-start"
        >
          <LiquidPopoverTrigger asChild>
            <PatternButton
              type="button"
              variant={isOverGlass ? "glass" : "outline"}
              color="neutral"
              size="sm"
              rounded="full"
              fullWidth
              contentAlign="between"
              className={cn(
                "text-xs font-normal h-9 px-3",
                !selectedProvince && "text-muted-foreground",
              )}
              icon={
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              }
              iconPosition="right"
            >
              <span className="truncate">
                {selectedProvince ? selectedProvince.name : t("selectProvince")}
              </span>
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchProvincePlaceholder")} />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {effectiveTree.map((prov) => {
                    const aliasesStr = Array.isArray(prov.aliases)
                      ? prov.aliases.join(" ")
                      : "";
                    const mergedInfoStr = Array.isArray(
                      prov.mergedFromProvinceNames,
                    )
                      ? prov.mergedFromProvinceNames.join(" ")
                      : prov.mergedIntoProvinceName || "";
                    const searchValue = `${prov.name} ${normalizeVietnameseSearchText(prov.name)} ${aliasesStr} ${mergedInfoStr} ${normalizeVietnameseSearchText(mergedInfoStr)} ${prov.code}`;
                    const isSelected = selectedProvince?.code === prov.code;

                    const hasMergedTarget =
                      isFourTierMode &&
                      prov.mergedIntoProvinceCode &&
                      prov.mergedIntoProvinceCode !== prov.code &&
                      prov.mergedIntoProvinceName;

                    return (
                      <CommandItem
                        key={prov.code}
                        value={searchValue}
                        onSelect={() => {
                          onChange({
                            provinceCode: prov.code,
                            provinceName: prov.name,
                            districtCode: null,
                            districtName: null,
                            wardCode: null,
                            wardName: null,
                            hamletCode: null,
                            hamletName: null,
                          });
                          setOpenProv(false);
                          if (
                            Array.isArray(prov.districts) &&
                            prov.districts.length > 0
                          ) {
                            setTimeout(() => setOpenDist(true), 60);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl px-2.5 py-2 text-xs transition-colors",
                          isSelected &&
                            "bg-primary/15 dark:bg-white/15 font-semibold text-foreground",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 shrink-0",
                            isSelected
                              ? "opacity-100 text-primary"
                              : "opacity-0",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{prov.name}</div>
                          {hasMergedTarget && (
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                              → {prov.mergedIntoProvinceName} (
                              {prov.districts.length} Q/H)
                            </div>
                          )}
                          {!isFourTierMode &&
                            Array.isArray(prov.mergedFromProvinceNames) &&
                            prov.mergedFromProvinceNames.length > 1 && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                Gộp: {prov.mergedFromProvinceNames.join(" + ")}
                              </div>
                            )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                          {prov.districts.length} Q/H
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* Cấp 2: Chọn Quận / Huyện / Thị xã / Thành phố thuộc tỉnh / Đặc khu */}
        <LiquidPopover
          open={openDist}
          onOpenChange={setOpenDist}
          matchWidth={false}
          placement="bottom-start"
        >
          <LiquidPopoverTrigger asChild disabled={!selectedProvince}>
            <PatternButton
              type="button"
              variant={isOverGlass ? "glass" : "outline"}
              color="neutral"
              size="sm"
              rounded="full"
              fullWidth
              contentAlign="between"
              disabled={!selectedProvince}
              className={cn(
                "text-xs font-normal h-9 px-3",
                !selectedDistrict && "text-muted-foreground",
              )}
              icon={
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              }
              iconPosition="right"
            >
              <span className="truncate">
                {selectedDistrict ? selectedDistrict.name : t("selectDistrict")}
              </span>
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchDistrictPlaceholder")} />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {districts.map((dist) => {
                    const aliasesStr = Array.isArray(dist.aliases)
                      ? dist.aliases.join(" ")
                      : "";
                    const ownerProv = full63Tree.find((p) =>
                      p.districts.some((d) => d.code === dist.code),
                    );
                    const ownerProvName = ownerProv?.name || "";
                    const searchValue = `${dist.name} ${normalizeVietnameseSearchText(dist.name)} ${aliasesStr} ${ownerProvName} ${normalizeVietnameseSearchText(ownerProvName)} ${dist.code}`;
                    const isSelected = districtCode === dist.code;

                    return (
                      <CommandItem
                        key={dist.code}
                        value={searchValue}
                        onSelect={() => {
                          const targetProv = isFourTierMode
                            ? ownerProv || selectedProvince
                            : selectedProvince || ownerProv;
                          onChange({
                            provinceCode: targetProv?.code || null,
                            provinceName: targetProv?.name || null,
                            districtCode: dist.code,
                            districtName: dist.name,
                            wardCode: null,
                            wardName: null,
                            hamletCode: null,
                            hamletName: null,
                          });
                          setOpenDist(false);
                          if (
                            Array.isArray(dist.wards) &&
                            dist.wards.length > 0
                          ) {
                            setTimeout(() => setOpenWard(true), 60);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl px-2.5 py-2 text-xs transition-colors",
                          isSelected &&
                            "bg-primary/15 dark:bg-white/15 font-semibold text-foreground",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 shrink-0",
                            isSelected
                              ? "opacity-100 text-primary"
                              : "opacity-0",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{dist.name}</div>
                          {!isFourTierMode &&
                            ownerProv &&
                            selectedProvince &&
                            ownerProv.code !== selectedProvince.code && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                Thuộc {ownerProv.name} cũ •{" "}
                                {dist.wards?.length || 0} P/X
                              </div>
                            )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                          #{dist.ghnDistrictId}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* Cấp 3: Chọn Phường / Xã / Thị trấn / Đặc khu */}
        <LiquidPopover
          open={openWard}
          onOpenChange={setOpenWard}
          matchWidth={false}
          placement="bottom-start"
        >
          <LiquidPopoverTrigger asChild disabled={!selectedDistrict}>
            <PatternButton
              type="button"
              variant={isOverGlass ? "glass" : "outline"}
              color="neutral"
              size="sm"
              rounded="full"
              fullWidth
              contentAlign="between"
              disabled={!selectedDistrict}
              className={cn(
                "text-xs font-normal h-9 px-3",
                !selectedWard && "text-muted-foreground",
              )}
              icon={
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              }
              iconPosition="right"
            >
              <span className="truncate">
                {selectedWard ? selectedWard.name : t("selectWard")}
              </span>
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput
                value={wardSearchInput}
                onValueChange={setWardSearchInput}
                placeholder={t("searchWardPlaceholder")}
              />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>
                  {wardSearchInput.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        const customWardName = wardSearchInput.trim();
                        onChange({
                          provinceCode: selectedProvince?.code || null,
                          provinceName: selectedProvince?.name || null,
                          districtCode: selectedDistrict?.code || null,
                          districtName: selectedDistrict?.name || null,
                          wardCode: `CUSTOM-WARD:${customWardName}`,
                          wardName: customWardName,
                          hamletCode: null,
                          hamletName: null,
                        });
                        setWardSearchInput("");
                        setOpenWard(false);
                        if (isFourTierMode) {
                          setTimeout(() => setOpenHamlet(true), 60);
                        }
                      }}
                      className="w-full px-2.5 py-2 text-xs text-primary font-semibold hover:bg-primary/10 rounded-xl cursor-pointer text-left"
                    >
                      + {t("useCustomWardLabel")}: &ldquo;
                      {wardSearchInput.trim()}&rdquo;
                    </button>
                  ) : (
                    t("noUnitFound")
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {wards.map((ward) => {
                    const aliasesStr = Array.isArray(ward.aliases)
                      ? ward.aliases.join(" ")
                      : "";
                    const searchValue = `${ward.name} ${normalizeVietnameseSearchText(ward.name)} ${aliasesStr} ${ward.code}`;
                    const isSelected = wardCode === ward.code;

                    return (
                      <CommandItem
                        key={ward.code}
                        value={searchValue}
                        onSelect={() => {
                          onChange({
                            provinceCode: selectedProvince?.code || null,
                            provinceName: selectedProvince?.name || null,
                            districtCode: selectedDistrict?.code || null,
                            districtName: selectedDistrict?.name || null,
                            wardCode: ward.code,
                            wardName: ward.name,
                            hamletCode: null,
                            hamletName: null,
                          });
                          setWardSearchInput("");
                          setOpenWard(false);
                          if (
                            isFourTierMode &&
                            Array.isArray(ward.hamlets) &&
                            ward.hamlets.length > 0
                          ) {
                            setTimeout(() => setOpenHamlet(true), 60);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl px-2.5 py-2 text-xs transition-colors",
                          isSelected &&
                            "bg-primary/15 dark:bg-white/15 font-semibold text-foreground",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 shrink-0",
                            isSelected
                              ? "opacity-100 text-primary"
                              : "opacity-0",
                          )}
                        />
                        <span className="truncate flex-1">{ward.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                          {ward.ghnWardCode}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* Cấp 4 Hành Chính (Thôn / Ấp / Bản / Khu phố / Tổ dân phố / Khóm / Tiểu khu / KĐT) */}
        {isFourTierMode && (
          <LiquidPopover
            open={openHamlet}
            onOpenChange={setOpenHamlet}
            matchWidth={false}
            placement="bottom-start"
          >
            <LiquidPopoverTrigger asChild disabled={!selectedWard}>
              <PatternButton
                type="button"
                variant={isOverGlass ? "glass" : "outline"}
                color="neutral"
                size="sm"
                rounded="full"
                fullWidth
                contentAlign="between"
                disabled={!selectedWard}
                className={cn(
                  "text-xs font-normal h-9 px-3",
                  !selectedHamlet && "text-muted-foreground",
                )}
                icon={
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                }
                iconPosition="right"
              >
                <span className="truncate">
                  {selectedHamlet ? selectedHamlet.name : t("selectHamlet")}
                </span>
              </PatternButton>
            </LiquidPopoverTrigger>
            <LiquidPopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput
                  value={hamletSearchInput}
                  onValueChange={setHamletSearchInput}
                  placeholder={t("searchHamletPlaceholder")}
                />
                <CommandList className="max-h-64 overflow-y-auto p-1">
                  <CommandEmpty>
                    {hamletSearchInput.trim() ? (
                      <button
                        type="button"
                        onClick={() => {
                          const customName = hamletSearchInput.trim();
                          onChange({
                            provinceCode:
                              rawLegacyProvince?.code ||
                              selectedProvince?.code ||
                              null,
                            provinceName:
                              rawLegacyProvince?.name ||
                              selectedProvince?.name ||
                              null,
                            districtCode: selectedDistrict?.code || null,
                            districtName: selectedDistrict?.name || null,
                            wardCode: selectedWard?.code || null,
                            wardName: selectedWard?.name || null,
                            hamletCode: `CUSTOM-${Date.now().toString().slice(-4)}`,
                            hamletName: customName,
                          });
                          setHamletSearchInput("");
                          setOpenHamlet(false);
                        }}
                        className="w-full px-2.5 py-2 text-xs text-primary font-semibold hover:bg-primary/10 rounded-xl cursor-pointer text-left"
                      >
                        + {t("useCustomHamletLabel")}: &ldquo;
                        {hamletSearchInput.trim()}&rdquo;
                      </button>
                    ) : (
                      t("noUnitFound")
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {hamlets.map((hamlet) => {
                      const aliasesStr = Array.isArray(hamlet.aliases)
                        ? hamlet.aliases.join(" ")
                        : "";
                      const searchValue = `${hamlet.name} ${normalizeVietnameseSearchText(hamlet.name)} ${aliasesStr} ${hamlet.code}`;
                      const isSelected =
                        hamletCode === hamlet.code ||
                        hamletName === hamlet.name;

                      return (
                        <CommandItem
                          key={hamlet.code}
                          value={searchValue}
                          onSelect={() => {
                            onChange({
                              provinceCode:
                                rawLegacyProvince?.code ||
                                selectedProvince?.code ||
                                null,
                              provinceName:
                                rawLegacyProvince?.name ||
                                selectedProvince?.name ||
                                null,
                              districtCode: selectedDistrict?.code || null,
                              districtName: selectedDistrict?.name || null,
                              wardCode: selectedWard?.code || null,
                              wardName: selectedWard?.name || null,
                              hamletCode: hamlet.code,
                              hamletName: hamlet.name,
                            });
                            setOpenHamlet(false);
                          }}
                          className={cn(
                            "cursor-pointer rounded-xl px-2.5 py-2 text-xs transition-colors",
                            isSelected &&
                              "bg-primary/15 dark:bg-white/15 font-semibold text-foreground",
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5 shrink-0",
                              isSelected
                                ? "opacity-100 text-primary"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate flex-1">{hamlet.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                            {hamlet.unitType}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </LiquidPopoverContent>
          </LiquidPopover>
        )}
      </div>

      {/* Hiển thị mã vùng ánh xạ sẵn 4 hãng vận chuyển (GHN, GHTK 4 cấp, ViettelPost, J&T) & Đối chiếu sáp nhập */}
      {selectedProvince && (
        <div className="flex items-center justify-between gap-1.5 flex-wrap text-[10px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <GlassBadge variant="info" size="sm">
              <Truck className="w-2.5 h-2.5 mr-1 inline" />
              GHN: #{selectedProvince.ghnProvinceId}
              {selectedDistrict ? `/${selectedDistrict.ghnDistrictId}` : ""}
              {selectedWard ? `/${selectedWard.ghnWardCode}` : ""}
            </GlassBadge>
            <GlassBadge variant="secondary" size="sm">
              <MapPin className="w-2.5 h-2.5 mr-1 inline" />
              GHTK: {selectedProvince.ghtkProvinceName}
              {selectedDistrict
                ? ` • ${selectedDistrict.ghtkDistrictName}`
                : ""}
              {selectedHamlet ? ` • ${selectedHamlet.name}` : ""}
            </GlassBadge>
            <GlassBadge variant="secondary" size="sm">
              VTP: #{selectedProvince.vtpProvinceId} • J&T:{" "}
              {selectedProvince.jtCityCode}
            </GlassBadge>
            {rawLegacyProvince &&
              rawLegacyProvince.mergedIntoProvinceCode &&
              rawLegacyProvince.mergedIntoProvinceCode !==
                rawLegacyProvince.code && (
                <GlassBadge variant="accent" size="sm">
                  <Building2 className="w-2.5 h-2.5 mr-0.5 inline" />
                  {isFourTierMode
                    ? `ĐVHC mới: ${rawLegacyProvince.mergedIntoProvinceName}`
                    : `Tỉnh cũ: ${rawLegacyProvince.name}`}
                </GlassBadge>
              )}
            {selectedWard && (
              <GlassBadge variant="success" size="sm">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                {selectedHamlet && isFourTierMode
                  ? t("fourTierMatchedBadge")
                  : t("autoMatchedBadge")}
              </GlassBadge>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange({
                provinceCode: null,
                provinceName: null,
                districtCode: null,
                districtName: null,
                wardCode: null,
                wardName: null,
                hamletCode: null,
                hamletName: null,
              });
            }}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer px-1.5 py-0.5 rounded-full hover:bg-destructive/10"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
