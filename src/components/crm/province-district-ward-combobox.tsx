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
  buildDynamicHamletSuggestions,
  fetchLiveFourthTierHamletsForWard,
  getDirectWardsOfProvince,
  getHamletsOfWard,
  syncAdministrativeTreeFromOpenApisAndCarriers,
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
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
 * Kiểm tra cây hành chính truyền từ store có đầy đủ chuẩn 63 tỉnh, >= 704 Quận/Huyện/Đặc khu
 * và >= 9.000 Phường/Xã/Thị trấn toàn quốc (tránh dữ liệu rút gọn cũ trong localStorage).
 */
function isCompleteAdministrativeTree(
  tree?: IVnProvinceUnit[] | null,
): boolean {
  if (!Array.isArray(tree) || tree.length < 63) return false;
  let totalDistricts = 0;
  let totalWards = 0;
  for (const prov of tree) {
    if (!Array.isArray(prov.districts)) return false;
    totalDistricts += prov.districts.length;
    for (const dist of prov.districts) {
      if (!Array.isArray(dist.wards) || dist.wards.length === 0) {
        return false;
      }
      totalWards += dist.wards.length;
    }
  }
  return totalDistricts >= 704 && totalWards >= 9000;
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

  // Hai chế độ hành chính chuẩn xác theo pháp luật & đối soát đa nguồn (GHN, GHTK Level-4, ViettelPost, OpenAPI):
  // - 3_TIER (Tab 3 Cấp Hành Chính): Tự động gộp địa giới theo 34 Tỉnh/Thành mới (Nghị quyết 202/2025/QH15 & 34 NQ UBTVQH 2025, Chinhphu.vn),
  //   KHÔNG CÓ CẤP HUYỆN & KHÔNG CÒN THỊ TRẤN: [1. 34 Tỉnh/Thành mới] -> [2. 3.321 Phường/Xã/Đặc khu mới] -> [3. Thôn/Ấp/Khu phố/TDP].
  // - 4_TIER (Tab 4 Cấp Hành Chính): Mở khóa đầy đủ 63 Tỉnh/Thành, 704 Quận/Huyện/Thị xã/TP/Đặc khu, 9.752+ Phường/Xã/Thị trấn
  //   và >530.000 Thôn/Ấp/Bản/Khu phố/Tổ dân phố/Khóm/KĐT.
  const [tierMode, setTierMode] = useState<"3_TIER" | "4_TIER">(
    defaultTierMode,
  );

  const [openProv, setOpenProv] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openWard, setOpenWard] = useState(false);
  const [openHamlet, setOpenHamlet] = useState(false);

  const [distSearchInput, setDistSearchInput] = useState("");
  const [wardSearchInput, setWardSearchInput] = useState("");
  const [hamletSearchInput, setHamletSearchInput] = useState("");

  const [isSyncingMultiSource, setIsSyncingMultiSource] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncSummary, setLastSyncSummary] = useState<string | null>(null);
  const [liveWardHamlets, setLiveWardHamlets] = useState<
    IVnHamletUnit[] | null
  >(null);

  // Cây 63 Tỉnh/Thành đầy đủ (dùng cho Tab 4 Cấp Hành Chính: 63 Tỉnh -> 704 Quận/Huyện -> 9.752+ Phường/Xã -> >530.000 Thôn/Ấp)
  const full63Tree = useMemo<IVnProvinceUnit[]>(() => {
    void syncVersion;
    if (isCompleteAdministrativeTree(administrativeTree)) {
      return administrativeTree!;
    }
    return [...VN_FULL_ADMINISTRATIVE_UNITS_TREE];
  }, [administrativeTree, syncVersion]);

  // Cây 34 Tỉnh/Thành mới sau sáp nhập (Nghị quyết 202/2025/QH15, Chinhphu.vn - Không có cấp huyện, 3.321 Phường/Xã/Đặc khu mới)
  const current34Tree = useMemo<IVnProvinceUnit[]>(() => {
    void syncVersion;
    return [...VN_CURRENT_34_ADMINISTRATIVE_UNITS_TREE];
  }, [syncVersion]);

  // Thống kê tổng số đơn vị trên cả 2 chế độ
  const treeStats = useMemo(() => {
    let totalDistricts = 0;
    let totalWards63 = 0;
    for (const p of full63Tree) {
      totalDistricts += p.districts.length;
      for (const d of p.districts) {
        totalWards63 += d.wards.length;
      }
    }
    let totalDirectWards34 = 0;
    for (const p34 of current34Tree) {
      totalDirectWards34 += getDirectWardsOfProvince(p34).length;
    }
    return {
      totalProvinces63: full63Tree.length,
      totalProvinces34: current34Tree.length,
      totalDistricts,
      totalWards63,
      totalDirectWards34,
    };
  }, [full63Tree, current34Tree]);

  // Tra cứu Phường/Xã đã chọn trên cả cây 4 cấp (63 tỉnh) và cây 3 cấp (34 tỉnh) kèm ánh xạ 2 chiều
  const resolvedWardRecord = useMemo<{
    ward: IVnWardUnit;
    postMergerWard: IVnWardUnit | null;
    legacyWard: IVnWardUnit | null;
    legacyDistrict: IVnDistrictUnit | null;
    legacyProvince: IVnProvinceUnit | null;
    mergedProvince: IVnProvinceUnit | null;
  } | null>(() => {
    if (!wardCode) return null;

    if (wardCode.startsWith("CUSTOM-WARD:")) {
      const customName = wardCode.replace("CUSTOM-WARD:", "");
      const customWard: IVnWardUnit = {
        code: wardCode,
        name: customName,
        aliases: [normalizeVietnameseSearchText(customName)],
        ghnWardCode: "00000",
        ghtkWardName: customName,
        vtpWardId: 0,
      };
      customWard.hamlets = getHamletsOfWard(customWard);
      return {
        ward: customWard,
        postMergerWard: customWard,
        legacyWard: customWard,
        legacyDistrict: null,
        legacyProvince: null,
        mergedProvince: null,
      };
    }

    // 1. Kiểm tra trong cây 34 Tỉnh/Thành mới (3.321 Phường/Xã/Đặc khu sau sáp nhập)
    for (const prov34 of current34Tree) {
      const directList = getDirectWardsOfProvince(prov34);
      const found34 = directList.find((w) => w.code === wardCode);
      if (found34) {
        const legProv = found34.legacyProvinceCode
          ? full63Tree.find((p) => p.code === found34.legacyProvinceCode) ||
            null
          : null;
        const legDist =
          legProv && found34.legacyDistrictCode
            ? legProv.districts.find(
                (d) => d.code === found34.legacyDistrictCode,
              ) || null
            : null;
        const legWard = legDist
          ? legDist.wards.find(
              (lw) =>
                lw.mergedIntoNewWardCode === found34.code ||
                normalizeVietnameseSearchText(lw.name) ===
                  normalizeVietnameseSearchText(found34.name),
            ) ||
            legDist.wards[0] ||
            null
          : null;
        return {
          ward: found34,
          postMergerWard: found34,
          legacyWard: legWard,
          legacyDistrict: legDist,
          legacyProvince: legProv,
          mergedProvince: prov34,
        };
      }
    }

    // 2. Kiểm tra trong cây 63 Tỉnh/Thành (9.752+ Phường/Xã/Thị trấn 4 cấp)
    for (const prov63 of full63Tree) {
      for (const dist of prov63.districts) {
        const found63 = dist.wards.find((w) => w.code === wardCode);
        if (found63) {
          const targetMergedCode = prov63.mergedIntoProvinceCode || prov63.code;
          const mergedProv =
            current34Tree.find((p) => p.code === targetMergedCode) || prov63;
          const pmList = getDirectWardsOfProvince(mergedProv);
          const pmWard =
            (found63.mergedIntoNewWardCode &&
              pmList.find((pw) => pw.code === found63.mergedIntoNewWardCode)) ||
            pmList.find(
              (pw) =>
                normalizeVietnameseSearchText(pw.name) ===
                  normalizeVietnameseSearchText(found63.name) ||
                (Array.isArray(pw.mergedFromWardNames) &&
                  pw.mergedFromWardNames.some(
                    (mfn) =>
                      normalizeVietnameseSearchText(mfn) ===
                      normalizeVietnameseSearchText(found63.name),
                  )),
            ) ||
            null;
          return {
            ward: found63,
            postMergerWard: pmWard,
            legacyWard: found63,
            legacyDistrict: dist,
            legacyProvince: prov63,
            mergedProvince: mergedProv,
          };
        }
      }
    }

    return null;
  }, [wardCode, full63Tree, current34Tree]);

  // Tìm Tỉnh/Thành gốc trong bộ 63 Tỉnh/Thành
  const rawLegacyProvince = useMemo<IVnProvinceUnit | null>(() => {
    if (districtCode) {
      const byDistrict = full63Tree.find((p) =>
        p.districts.some((d) => d.code === districtCode),
      );
      if (byDistrict) return byDistrict;
    }
    if (resolvedWardRecord?.legacyProvince) {
      return resolvedWardRecord.legacyProvince;
    }
    if (provinceCode) {
      const byCode = full63Tree.find((p) => p.code === provinceCode);
      if (byCode) return byCode;
    }
    return null;
  }, [full63Tree, provinceCode, districtCode, resolvedWardRecord]);

  // Tỉnh/Thành đang hiển thị trên Cấp 1 theo đúng chế độ Tab 3 Cấp (34 tỉnh) hoặc Tab 4 Cấp (63 tỉnh)
  const selectedProvince = useMemo<IVnProvinceUnit | null>(() => {
    if (!provinceCode && !rawLegacyProvince && !resolvedWardRecord) return null;

    if (tierMode === "3_TIER") {
      if (resolvedWardRecord?.mergedProvince) {
        return resolvedWardRecord.mergedProvince;
      }
      if (rawLegacyProvince) {
        const mergedTargetCode =
          rawLegacyProvince.mergedIntoProvinceCode || rawLegacyProvince.code;
        const mergedProv = current34Tree.find(
          (p) => p.code === mergedTargetCode,
        );
        if (mergedProv) return mergedProv;
      }
      if (provinceCode) {
        const direct34 = current34Tree.find((p) => p.code === provinceCode);
        if (direct34) return direct34;
        const legacyMatch = full63Tree.find((p) => p.code === provinceCode);
        if (legacyMatch) {
          const targetCode =
            legacyMatch.mergedIntoProvinceCode || legacyMatch.code;
          return (
            current34Tree.find((p) => p.code === targetCode) || legacyMatch
          );
        }
      }
      return null;
    }

    // Chế độ 4_TIER (63 Tỉnh/Thành đầy đủ)
    if (rawLegacyProvince) {
      return rawLegacyProvince;
    }
    if (provinceCode) {
      return full63Tree.find((p) => p.code === provinceCode) || null;
    }
    return null;
  }, [
    tierMode,
    provinceCode,
    rawLegacyProvince,
    resolvedWardRecord,
    current34Tree,
    full63Tree,
  ]);

  // Quận/Huyện đang chọn (tự động suy diễn từ resolvedWardRecord nếu người dùng chọn Phường/Xã ở Tab 3 Cấp không qua cấp huyện)
  const selectedDistrict = useMemo<IVnDistrictUnit | null>(() => {
    const effectiveDistCode =
      districtCode || resolvedWardRecord?.legacyDistrict?.code || null;
    if (!effectiveDistCode) return null;

    if (selectedProvince) {
      const inSelected = selectedProvince.districts.find(
        (d) => d.code === effectiveDistCode,
      );
      if (inSelected) return inSelected;
    }
    if (rawLegacyProvince) {
      const inLegacy = rawLegacyProvince.districts.find(
        (d) => d.code === effectiveDistCode,
      );
      if (inLegacy) return inLegacy;
    }
    for (const p of full63Tree) {
      const found = p.districts.find((d) => d.code === effectiveDistCode);
      if (found) return found;
    }
    return null;
  }, [
    districtCode,
    resolvedWardRecord,
    selectedProvince,
    rawLegacyProvince,
    full63Tree,
  ]);

  // Danh sách Quận/Huyện mở khóa cho Tab 4 Cấp Hành Chính (704 Quận/Huyện/Thị xã/TP/Đặc khu)
  const unlockedFourTierDistricts = useMemo<IVnDistrictUnit[]>(() => {
    if (selectedProvince) {
      return selectedProvince.districts || [];
    }
    const allDistricts: IVnDistrictUnit[] = [];
    for (const p of full63Tree) {
      for (const d of p.districts) {
        allDistricts.push(d);
      }
    }
    if (!distSearchInput.trim()) {
      return allDistricts.slice(0, 160);
    }
    return allDistricts;
  }, [selectedProvince, full63Tree, distSearchInput]);

  // Danh sách 3.321 Phường/Xã/Đặc khu trực thuộc thẳng Tỉnh/Thành (KHÔNG CÓ CẤP HUYỆN, KHÔNG CÒN THỊ TRẤN) cho Tab 3 Cấp Hành Chính:
  const unlockedThreeTierDirectWards = useMemo<IVnWardUnit[]>(() => {
    if (selectedProvince) {
      return getDirectWardsOfProvince(selectedProvince);
    }
    const allDirect: IVnWardUnit[] = [];
    for (const p34 of current34Tree) {
      const pWards = getDirectWardsOfProvince(p34);
      for (const w of pWards) {
        allDirect.push(w);
      }
    }
    return wardSearchInput.trim() ? allDirect : allDirect.slice(0, 200);
  }, [selectedProvince, current34Tree, wardSearchInput]);

  // Danh sách 9.752+ Phường/Xã/Thị trấn mở khóa cho Tab 4 Cấp Hành Chính:
  const unlockedFourTierWards = useMemo<IVnWardUnit[]>(() => {
    if (selectedDistrict) {
      return selectedDistrict.wards || [];
    }
    if (selectedProvince) {
      const provWards: IVnWardUnit[] = [];
      for (const d of selectedProvince.districts || []) {
        for (const w of d.wards || []) {
          provWards.push(w);
        }
      }
      return provWards;
    }
    const allWards: IVnWardUnit[] = [];
    for (const p of full63Tree) {
      for (const d of p.districts) {
        for (const w of d.wards) {
          allWards.push(w);
        }
      }
    }
    return wardSearchInput.trim() ? allWards : allWards.slice(0, 200);
  }, [selectedDistrict, selectedProvince, full63Tree, wardSearchInput]);

  const activeWardsList = useMemo<IVnWardUnit[]>(
    () =>
      tierMode === "3_TIER"
        ? unlockedThreeTierDirectWards
        : unlockedFourTierWards,
    [tierMode, unlockedThreeTierDirectWards, unlockedFourTierWards],
  );

  // Phường/Xã đang hiển thị theo đúng chế độ Tab 3 Cấp (Phường/Xã/Đặc khu mới sau sáp nhập) hoặc Tab 4 Cấp (Phường/Xã/Thị trấn 4 cấp)
  const selectedWard = useMemo<IVnWardUnit | null>(() => {
    if (tierMode === "3_TIER" && resolvedWardRecord?.postMergerWard) {
      return resolvedWardRecord.postMergerWard;
    }
    if (tierMode === "4_TIER" && resolvedWardRecord?.legacyWard) {
      return resolvedWardRecord.legacyWard;
    }
    if (resolvedWardRecord?.ward) {
      return resolvedWardRecord.ward;
    }
    if (!wardCode) return null;
    return activeWardsList.find((w) => w.code === wardCode) || null;
  }, [tierMode, resolvedWardRecord, wardCode, activeWardsList]);

  // Tự động đồng bộ trực tuyến danh sách Thôn/Ấp/Khu phố Level-4 từ GHTK API khi người dùng chọn Phường/Xã
  useEffect(() => {
    let cancelled = false;
    if (!selectedWard) {
      setLiveWardHamlets(null);
      return;
    }
    const baseList = getHamletsOfWard(
      selectedWard,
      selectedProvince?.region || "BAC_BO",
    );
    setLiveWardHamlets(baseList);

    fetchLiveFourthTierHamletsForWard({
      provinceName:
        selectedProvince?.ghtkProvinceName ||
        selectedProvince?.name ||
        "Thành phố Hà Nội",
      districtName:
        selectedDistrict?.ghtkDistrictName ||
        selectedWard.legacyDistrictName ||
        null,
      ward: selectedWard,
    })
      .then((enriched) => {
        if (!cancelled && Array.isArray(enriched) && enriched.length > 0) {
          setLiveWardHamlets([...enriched]);
        }
      })
      .catch(() => {
        // Fallback an toàn về bộ >45 Thôn/Ấp/Khu phố có sẵn trong từ điển
      });

    return () => {
      cancelled = true;
    };
  }, [selectedWard, selectedProvince, selectedDistrict]);

  // Kết hợp bộ >45 Thôn/Ấp/Khu phố/TDP có sẵn + dữ liệu Level-4 trực tuyến + bộ gợi ý đa tiền tố thông minh khi gõ tìm kiếm
  const hamlets = useMemo<IVnHamletUnit[]>(() => {
    const base =
      liveWardHamlets && liveWardHamlets.length > 0
        ? liveWardHamlets
        : selectedWard
          ? getHamletsOfWard(selectedWard, selectedProvince?.region || "BAC_BO")
          : getHamletsOfWard(
              {
                code: "DEFAULT-WARD",
                name: "Phường Trung Tâm",
                aliases: [],
                ghnWardCode: "10000",
                ghtkWardName: "Phường Trung Tâm",
              },
              selectedProvince?.region || "BAC_BO",
            );

    if (!hamletSearchInput.trim()) {
      return base;
    }

    const dynamicSuggestions = buildDynamicHamletSuggestions(
      hamletSearchInput,
      selectedWard,
    );
    const seenNorm = new Set(
      base.map((h) => normalizeVietnameseSearchText(h.name)),
    );
    const merged = [...base];
    for (const sugg of dynamicSuggestions) {
      const norm = normalizeVietnameseSearchText(sugg.name);
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        merged.unshift(sugg);
      }
    }
    return merged;
  }, [liveWardHamlets, selectedWard, selectedProvince, hamletSearchInput]);

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
  const effectiveProvinceList = isFourTierMode ? full63Tree : current34Tree;

  // Khi người dùng bấm chuyển đổi giữa Tab 3 Cấp Hành Chính (34 Tỉnh/Thành - 3.321 Xã/Phường/Đặc khu mới)
  // và Tab 4 Cấp Hành Chính (63 Tỉnh/Thành - 704 Quận/Huyện - 9.752+ Xã/Phường/Thị trấn),
  // tự động ánh xạ 2 chiều cả Tỉnh/Thành, Quận/Huyện và Phường/Xã tương ứng!
  const handleSwitchTierMode = (nextMode: "3_TIER" | "4_TIER") => {
    setTierMode(nextMode);
    if (!selectedProvince && !rawLegacyProvince && !selectedWard) return;

    if (nextMode === "3_TIER") {
      const targetMergedProv =
        resolvedWardRecord?.mergedProvince ||
        (rawLegacyProvince &&
          current34Tree.find(
            (p) =>
              p.code ===
              (rawLegacyProvince.mergedIntoProvinceCode ||
                rawLegacyProvince.code),
          )) ||
        selectedProvince;

      const targetPostMergerWard =
        resolvedWardRecord?.postMergerWard || selectedWard;

      if (targetMergedProv) {
        onChange({
          provinceCode: targetMergedProv.code,
          provinceName: targetMergedProv.name,
          districtCode:
            selectedDistrict?.code ||
            targetPostMergerWard?.legacyDistrictCode ||
            districtCode ||
            null,
          districtName:
            selectedDistrict?.name ||
            targetPostMergerWard?.legacyDistrictName ||
            null,
          wardCode: targetPostMergerWard?.code || wardCode || null,
          wardName: targetPostMergerWard?.name || null,
          hamletCode: selectedHamlet?.code || hamletCode || null,
          hamletName: selectedHamlet?.name || hamletName || null,
        });
      }
    } else {
      const restoredLegacyProv =
        rawLegacyProvince ||
        resolvedWardRecord?.legacyProvince ||
        selectedProvince;
      const restoredLegacyDist =
        selectedDistrict || resolvedWardRecord?.legacyDistrict || null;
      const restoredLegacyWard = resolvedWardRecord?.legacyWard || selectedWard;

      if (restoredLegacyProv) {
        onChange({
          provinceCode: restoredLegacyProv.code,
          provinceName: restoredLegacyProv.name,
          districtCode: restoredLegacyDist?.code || districtCode || null,
          districtName: restoredLegacyDist?.name || null,
          wardCode: restoredLegacyWard?.code || wardCode || null,
          wardName: restoredLegacyWard?.name || null,
          hamletCode: selectedHamlet?.code || hamletCode || null,
          hamletName: selectedHamlet?.name || hamletName || null,
        });
      }
    }
  };

  // Đồng bộ trực tuyến đa nguồn (provinces.open-api.vn v1/v2, GHN, GHTK Level-4, ViettelPost)
  const handleSyncMultiSource = async () => {
    if (isSyncingMultiSource) return;
    setIsSyncingMultiSource(true);
    try {
      const report = await syncAdministrativeTreeFromOpenApisAndCarriers();
      setSyncVersion((v) => v + 1);
      setLastSyncSummary(
        `${report.total34Provinces} tỉnh mới (${report.total3TierDirectWards} P/X/ĐK) • ${report.total63Provinces} tỉnh (${report.total704Districts} Q/H • ${report.total4TierWards} P/X)`,
      );
    } finally {
      setIsSyncingMultiSource(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Thanh Tab chuyển đổi:
          - Tab 3 Cấp Hành Chính: 34 Tỉnh/Thành mới (Nghị quyết 202/2025/QH15, Chinhphu.vn) -> 3.321 Phường/Xã/Đặc khu mới (Không cấp huyện, không còn Thị trấn) -> Thôn/Ấp/TDP
          - Tab 4 Cấp Hành Chính: 63 Tỉnh/Thành -> 704 Quận/Huyện/TX/TP/Đặc khu -> 9.752+ Phường/Xã/Thị trấn -> >530.000 Thôn/Ấp/TDP */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted/50 p-0.5 border border-border/50">
          <button
            type="button"
            onClick={() => handleSwitchTierMode("3_TIER")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1",
              tierMode === "3_TIER"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>
              {t("mode3TierBtn")} ({treeStats.totalProvinces34} Tỉnh •{" "}
              {treeStats.totalDirectWards34} P/X/ĐK)
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTierMode("4_TIER")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1",
              tierMode === "4_TIER"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>
              {t("mode4TierBtn")} ({treeStats.totalProvinces63} Tỉnh •{" "}
              {treeStats.totalDistricts} Q/H • {treeStats.totalWards63} P/X)
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {lastSyncSummary
              ? lastSyncSummary
              : isFourTierMode
                ? t("mode4TierScopeHint")
                : t("mode3TierScopeHint")}
          </span>
          <button
            type="button"
            onClick={handleSyncMultiSource}
            disabled={isSyncingMultiSource}
            title="Đối soát & đồng bộ trực tuyến từ OpenAPI Hành Chính VN (v1/v2), GHN, GHTK Level-4, ViettelPost"
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "w-2.5 h-2.5",
                isSyncingMultiSource && "animate-spin",
              )}
            />
            <span>
              {isSyncingMultiSource ? "Đang đồng bộ..." : "Đồng bộ OpenAPI/3PL"}
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          isFourTierMode ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {/* CẤP 1: Chọn Tỉnh / Thành phố (34 Tỉnh/Thành mới ở Tab 3 Cấp | 63 Tỉnh/Thành ở Tab 4 Cấp) */}
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
                {selectedProvince
                  ? selectedProvince.name
                  : isFourTierMode
                    ? t("selectProvince63")
                    : t("selectProvince34")}
              </span>
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder={
                  isFourTierMode
                    ? t("searchProvince63Placeholder")
                    : t("searchProvince34Placeholder")
                }
              />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {effectiveProvinceList.map((prov) => {
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

                    const directWardCount =
                      getDirectWardsOfProvince(prov).length;

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
                          if (isFourTierMode) {
                            setTimeout(() => setOpenDist(true), 60);
                          } else {
                            // Ở Tab 3 Cấp Hành Chính (không có cấp huyện), chọn xong Tỉnh/Thành sẽ mở thẳng 3.321 Phường/Xã/Đặc khu mới!
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
                          <div className="truncate">{prov.name}</div>
                          {hasMergedTarget && (
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                              → {prov.mergedIntoProvinceName} (NQ 202/2025/QH15)
                            </div>
                          )}
                          {!isFourTierMode &&
                            Array.isArray(prov.mergedFromProvinceNames) &&
                            prov.mergedFromProvinceNames.length > 1 && (
                              <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                                Gộp: {prov.mergedFromProvinceNames.join(" + ")}
                              </div>
                            )}
                          {!isFourTierMode &&
                            (!prov.mergedFromProvinceNames ||
                              prov.mergedFromProvinceNames.length <= 1) && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                Giữ nguyên • Không tổ chức cấp huyện
                              </div>
                            )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                          {isFourTierMode
                            ? `${prov.districts.length} Q/H`
                            : `${directWardCount} P/X`}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* CẤP 2 CỦA TAB 4 CẤP: Chọn Quận / Huyện / Thị xã / TP / Đặc khu (704 đơn vị - ẨN HOÀN TOÀN Ở TAB 3 CẤP VÌ BỎ CẤP HUYỆN) */}
        {isFourTierMode && (
          <LiquidPopover
            open={openDist}
            onOpenChange={setOpenDist}
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
                  !selectedDistrict && "text-muted-foreground",
                )}
                icon={
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                }
                iconPosition="right"
              >
                <span className="truncate">
                  {selectedDistrict
                    ? selectedDistrict.name
                    : t("selectDistrict")}
                </span>
              </PatternButton>
            </LiquidPopoverTrigger>
            <LiquidPopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput
                  value={distSearchInput}
                  onValueChange={setDistSearchInput}
                  placeholder={t("searchDistrictPlaceholder")}
                />
                <CommandList className="max-h-64 overflow-y-auto p-1">
                  <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                  <CommandGroup>
                    {unlockedFourTierDistricts.map((dist) => {
                      const aliasesStr = Array.isArray(dist.aliases)
                        ? dist.aliases.join(" ")
                        : "";
                      const ownerProv =
                        (dist.legacyProvinceCode &&
                          full63Tree.find(
                            (p) => p.code === dist.legacyProvinceCode,
                          )) ||
                        full63Tree.find((p) =>
                          p.districts.some((d) => d.code === dist.code),
                        );
                      const ownerProvName = ownerProv?.name || "";
                      const searchValue = `${dist.name} ${normalizeVietnameseSearchText(dist.name)} ${aliasesStr} ${ownerProvName} ${normalizeVietnameseSearchText(ownerProvName)} ${dist.code}`;
                      const isSelected = selectedDistrict?.code === dist.code;

                      return (
                        <CommandItem
                          key={dist.code}
                          value={searchValue}
                          onSelect={() => {
                            const targetProv = ownerProv || selectedProvince;
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
                            setDistSearchInput("");
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
                            <div className="text-[10px] text-muted-foreground truncate">
                              {ownerProvName} • {dist.wards?.length || 0} P/X
                            </div>
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
        )}

        {/* CẤP 2 CỦA TAB 3 CẤP (3.321 PHƯỜNG/XÃ/ĐẶC KHU MỚI - KHÔNG CẤP HUYỆN, KHÔNG THỊ TRẤN)
            & CẤP 3 CỦA TAB 4 CẤP (9.752+ PHƯỜNG/XÃ/THỊ TRẤN): */}
        <LiquidPopover
          open={openWard}
          onOpenChange={setOpenWard}
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
                !selectedWard && "text-muted-foreground",
              )}
              icon={
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              }
              iconPosition="right"
            >
              <span className="truncate">
                {selectedWard
                  ? selectedWard.name
                  : isFourTierMode
                    ? t("selectWard")
                    : t("selectWardDirect34")}
              </span>
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput
                value={wardSearchInput}
                onValueChange={setWardSearchInput}
                placeholder={
                  isFourTierMode
                    ? t("searchWardPlaceholder")
                    : t("searchWardDirect34Placeholder")
                }
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
                        setTimeout(() => setOpenHamlet(true), 60);
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
                  {activeWardsList.map((ward) => {
                    const aliasesStr = Array.isArray(ward.aliases)
                      ? ward.aliases.join(" ")
                      : "";
                    const mergedFromStr = Array.isArray(
                      ward.mergedFromWardNames,
                    )
                      ? ward.mergedFromWardNames.join(" ")
                      : "";
                    const mergedIntoStr = ward.mergedIntoNewWardName || "";
                    const legDistName = ward.legacyDistrictName || "";
                    const legProvName = ward.legacyProvinceName || "";
                    const mergedProvName = ward.mergedProvinceName || "";

                    const searchValue = `${ward.name} ${normalizeVietnameseSearchText(ward.name)} ${aliasesStr} ${mergedFromStr} ${normalizeVietnameseSearchText(mergedFromStr)} ${mergedIntoStr} ${normalizeVietnameseSearchText(mergedIntoStr)} ${legDistName} ${normalizeVietnameseSearchText(legDistName)} ${legProvName} ${normalizeVietnameseSearchText(legProvName)} ${mergedProvName} ${ward.code}`;
                    const isSelected = selectedWard?.code === ward.code;

                    return (
                      <CommandItem
                        key={ward.code}
                        value={searchValue}
                        onSelect={() => {
                          const resolvedProvCode = isFourTierMode
                            ? ward.legacyProvinceCode ||
                              selectedProvince?.code ||
                              null
                            : ward.mergedProvinceCode ||
                              selectedProvince?.code ||
                              ward.legacyProvinceCode ||
                              null;

                          const resolvedProvName = isFourTierMode
                            ? ward.legacyProvinceName ||
                              selectedProvince?.name ||
                              null
                            : ward.mergedProvinceName ||
                              selectedProvince?.name ||
                              ward.legacyProvinceName ||
                              null;

                          const resolvedDistCode =
                            ward.legacyDistrictCode ||
                            selectedDistrict?.code ||
                            null;
                          const resolvedDistName =
                            ward.legacyDistrictName ||
                            selectedDistrict?.name ||
                            null;

                          onChange({
                            provinceCode: resolvedProvCode,
                            provinceName: resolvedProvName,
                            districtCode: resolvedDistCode,
                            districtName: resolvedDistName,
                            wardCode: ward.code,
                            wardName: ward.name,
                            hamletCode: null,
                            hamletName: null,
                          });
                          setWardSearchInput("");
                          setOpenWard(false);
                          setTimeout(() => setOpenHamlet(true), 60);
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
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{ward.name}</span>
                            {(ward.isNewPostMergerWard ||
                              ward.unitType === "DAC_KHU") &&
                              !isFourTierMode && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <Sparkles className="w-2 h-2 mr-0.5" />
                                  NQ UBTVQH 2025
                                </span>
                              )}
                          </div>
                          {!isFourTierMode &&
                            Array.isArray(ward.mergedFromWardNames) &&
                            ward.mergedFromWardNames.length > 0 && (
                              <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                                Gộp từ: {ward.mergedFromWardNames.join(", ")}
                              </div>
                            )}
                          {!isFourTierMode && legDistName && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              Trực thuộc{" "}
                              {ward.mergedProvinceName ||
                                selectedProvince?.name ||
                                ""}{" "}
                              • Khu vực {legDistName}
                              {legProvName &&
                              ward.mergedProvinceName &&
                              legProvName !== ward.mergedProvinceName
                                ? ` (${legProvName} cũ)`
                                : " cũ"}
                            </div>
                          )}
                          {isFourTierMode && ward.mergedIntoNewWardName && (
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                              → ĐVHC 3 cấp mới: {ward.mergedIntoNewWardName}
                            </div>
                          )}
                          {isFourTierMode &&
                            !selectedDistrict &&
                            legDistName && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                {legDistName}
                                {legProvName ? ` • ${legProvName}` : ""}
                              </div>
                            )}
                        </div>
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

        {/* CẤP 3 CỦA TAB 3 CẤP & CẤP 4 CỦA TAB 4 CẤP:
            Chọn Thôn / Ấp / Bản / Làng / Buôn / Khu phố / Tổ dân phố / Khóm / Tiểu khu / Xóm / KĐT / Đường phố (>530.000 đơn vị + GHTK Level-4 + Gợi ý động) */}
        <LiquidPopover
          open={openHamlet}
          onOpenChange={setOpenHamlet}
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
                          provinceCode: isFourTierMode
                            ? rawLegacyProvince?.code ||
                              selectedProvince?.code ||
                              null
                            : selectedProvince?.code ||
                              rawLegacyProvince?.mergedIntoProvinceCode ||
                              null,
                          provinceName: isFourTierMode
                            ? rawLegacyProvince?.name ||
                              selectedProvince?.name ||
                              null
                            : selectedProvince?.name ||
                              rawLegacyProvince?.mergedIntoProvinceName ||
                              null,
                          districtCode:
                            selectedDistrict?.code ||
                            selectedWard?.legacyDistrictCode ||
                            districtCode ||
                            null,
                          districtName:
                            selectedDistrict?.name ||
                            selectedWard?.legacyDistrictName ||
                            null,
                          wardCode: selectedWard?.code || wardCode || null,
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
                      hamletCode === hamlet.code || hamletName === hamlet.name;

                    return (
                      <CommandItem
                        key={hamlet.code}
                        value={searchValue}
                        onSelect={() => {
                          onChange({
                            provinceCode: isFourTierMode
                              ? rawLegacyProvince?.code ||
                                selectedProvince?.code ||
                                null
                              : selectedProvince?.code ||
                                rawLegacyProvince?.mergedIntoProvinceCode ||
                                null,
                            provinceName: isFourTierMode
                              ? rawLegacyProvince?.name ||
                                selectedProvince?.name ||
                                null
                              : selectedProvince?.name ||
                                rawLegacyProvince?.mergedIntoProvinceName ||
                                null,
                            districtCode:
                              selectedDistrict?.code ||
                              selectedWard?.legacyDistrictCode ||
                              districtCode ||
                              null,
                            districtName:
                              selectedDistrict?.name ||
                              selectedWard?.legacyDistrictName ||
                              null,
                            wardCode: selectedWard?.code || wardCode || null,
                            wardName: selectedWard?.name || null,
                            hamletCode: hamlet.code,
                            hamletName: hamlet.name,
                          });
                          setHamletSearchInput("");
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
      </div>

      {/* Hiển thị mã vùng ánh xạ sẵn 4 hãng vận chuyển (GHN, GHTK Level-4, ViettelPost, J&T) & Đối chiếu sáp nhập NQ 202/2025/QH15 */}
      {(selectedProvince || selectedWard) && (
        <div className="flex items-center justify-between gap-1.5 flex-wrap text-[10px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <GlassBadge variant="info" size="sm">
              <Truck className="w-2.5 h-2.5 mr-1 inline" />
              GHN: #
              {selectedWard?.ghnProvinceId ||
                selectedProvince?.ghnProvinceId ||
                201}
              {selectedDistrict
                ? `/${selectedDistrict.ghnDistrictId}`
                : selectedWard?.ghnDistrictId
                  ? `/${selectedWard.ghnDistrictId}`
                  : ""}
              {selectedWard ? `/${selectedWard.ghnWardCode}` : ""}
            </GlassBadge>
            <GlassBadge variant="secondary" size="sm">
              <MapPin className="w-2.5 h-2.5 mr-1 inline" />
              GHTK:{" "}
              {selectedWard?.ghtkProvinceName ||
                selectedProvince?.ghtkProvinceName}
              {!isFourTierMode
                ? ` • Không cấp huyện (${selectedDistrict?.ghtkDistrictName || selectedWard?.legacyDistrictName || "Trực thuộc tỉnh"})`
                : selectedDistrict
                  ? ` • ${selectedDistrict.ghtkDistrictName}`
                  : ""}
              {selectedWard ? ` • ${selectedWard.name}` : ""}
              {selectedHamlet ? ` • ${selectedHamlet.name}` : ""}
            </GlassBadge>
            <GlassBadge variant="secondary" size="sm">
              VTP: #
              {selectedWard?.vtpProvinceId ||
                selectedProvince?.vtpProvinceId ||
                1}{" "}
              • J&T:{" "}
              {selectedWard?.jtCityCode ||
                selectedProvince?.jtCityCode ||
                "HNI"}
            </GlassBadge>
            {rawLegacyProvince &&
              rawLegacyProvince.mergedIntoProvinceCode &&
              rawLegacyProvince.mergedIntoProvinceCode !==
                rawLegacyProvince.code && (
                <GlassBadge variant="accent" size="sm">
                  <Building2 className="w-2.5 h-2.5 mr-0.5 inline" />
                  {isFourTierMode
                    ? `NQ 202/2025/QH15: → ${rawLegacyProvince.mergedIntoProvinceName}`
                    : `Gộp từ: ${rawLegacyProvince.name}${selectedDistrict ? ` (${selectedDistrict.name} cũ)` : ""}`}
                </GlassBadge>
              )}
            {selectedWard && (
              <GlassBadge variant="success" size="sm">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                {!isFourTierMode
                  ? t("threeTierNoDistrictMatchedBadge")
                  : selectedHamlet
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
