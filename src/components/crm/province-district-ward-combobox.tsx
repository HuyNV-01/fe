"use client";

import { useMemo, useState } from "react";
import {
  GlassBadge,
  LiquidPopover,
  LiquidPopoverContent,
  LiquidPopoverTrigger,
  PatternButton,
} from "@/components/toolkit";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { IVnProvinceUnit } from "@/types/crm";
import { Check, ChevronsUpDown, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface ProvinceDistrictWardComboboxProps {
  administrativeTree: IVnProvinceUnit[];
  provinceCode?: string | null;
  districtCode?: string | null;
  wardCode?: string | null;
  onChange: (value: {
    provinceCode: string | null;
    provinceName: string | null;
    districtCode: string | null;
    districtName: string | null;
    wardCode: string | null;
    wardName: string | null;
  }) => void;
}

export function ProvinceDistrictWardCombobox({
  administrativeTree,
  provinceCode,
  districtCode,
  wardCode,
  onChange,
}: ProvinceDistrictWardComboboxProps) {
  const t = useTranslations("Crm360.addressSelector");
  const [openProv, setOpenProv] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  const selectedProvince = useMemo(
    () => administrativeTree.find((p) => p.code === provinceCode) || null,
    [administrativeTree, provinceCode],
  );

  const districts = useMemo(
    () => selectedProvince?.districts || [],
    [selectedProvince],
  );

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.code === districtCode) || null,
    [districts, districtCode],
  );

  const wards = useMemo(
    () => selectedDistrict?.wards || [],
    [selectedDistrict],
  );

  const selectedWard = useMemo(
    () => wards.find((w) => w.code === wardCode) || null,
    [wards, wardCode],
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. Chọn Tỉnh / Thành phố */}
        <LiquidPopover open={openProv} onOpenChange={setOpenProv}>
          <LiquidPopoverTrigger asChild>
            <PatternButton
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              contentAlign="between"
              className="text-xs font-normal h-9 px-2.5"
            >
              <span className="truncate">
                {selectedProvince ? selectedProvince.name : t("selectProvince")}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder={t("searchProvincePlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {administrativeTree.map((prov) => (
                    <CommandItem
                      key={prov.code}
                      value={`${prov.name} ${prov.aliases.join(" ")}`}
                      onSelect={() => {
                        onChange({
                          provinceCode: prov.code,
                          provinceName: prov.name,
                          districtCode: null,
                          districtName: null,
                          wardCode: null,
                          wardName: null,
                        });
                        setOpenProv(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          provinceCode === prov.code
                            ? "opacity-100 text-primary"
                            : "opacity-0",
                        )}
                      />
                      <span className="text-xs">{prov.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* 2. Chọn Quận / Huyện */}
        <LiquidPopover open={openDist} onOpenChange={setOpenDist}>
          <LiquidPopoverTrigger asChild>
            <PatternButton
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              contentAlign="between"
              disabled={!selectedProvince}
              className="text-xs font-normal h-9 px-2.5"
            >
              <span className="truncate">
                {selectedDistrict ? selectedDistrict.name : t("selectDistrict")}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder={t("searchDistrictPlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {districts.map((dist) => (
                    <CommandItem
                      key={dist.code}
                      value={`${dist.name} ${dist.aliases.join(" ")}`}
                      onSelect={() => {
                        onChange({
                          provinceCode: selectedProvince?.code || null,
                          provinceName: selectedProvince?.name || null,
                          districtCode: dist.code,
                          districtName: dist.name,
                          wardCode: null,
                          wardName: null,
                        });
                        setOpenDist(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          districtCode === dist.code
                            ? "opacity-100 text-primary"
                            : "opacity-0",
                        )}
                      />
                      <span className="text-xs">{dist.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* 3. Chọn Phường / Xã */}
        <LiquidPopover open={openWard} onOpenChange={setOpenWard}>
          <LiquidPopoverTrigger asChild>
            <PatternButton
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              contentAlign="between"
              disabled={!selectedDistrict}
              className="text-xs font-normal h-9 px-2.5"
            >
              <span className="truncate">
                {selectedWard ? selectedWard.name : t("selectWard")}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </PatternButton>
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder={t("searchWardPlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {wards.map((ward) => (
                    <CommandItem
                      key={ward.code}
                      value={`${ward.name} ${ward.aliases.join(" ")}`}
                      onSelect={() => {
                        onChange({
                          provinceCode: selectedProvince?.code || null,
                          provinceName: selectedProvince?.name || null,
                          districtCode: selectedDistrict?.code || null,
                          districtName: selectedDistrict?.name || null,
                          wardCode: ward.code,
                          wardName: ward.name,
                        });
                        setOpenWard(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          wardCode === ward.code
                            ? "opacity-100 text-primary"
                            : "opacity-0",
                        )}
                      />
                      <span className="text-xs">{ward.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>
      </div>

      {/* Hiển thị mã vùng ánh xạ sẵn 4 hãng vận chuyển (GHN, GHTK, ViettelPost, J&T) */}
      {selectedProvince && (
        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
          <GlassBadge variant="info" size="sm">
            <Truck className="w-2.5 h-2.5 mr-1 inline" />
            GHN: #{selectedProvince.ghnProvinceId}
            {selectedDistrict ? `/${selectedDistrict.ghnDistrictId}` : ""}
            {selectedWard ? `/${selectedWard.ghnWardCode}` : ""}
          </GlassBadge>
          <GlassBadge variant="secondary" size="sm">
            <MapPin className="w-2.5 h-2.5 mr-1 inline" />
            GHTK: {selectedProvince.ghtkProvinceName}
          </GlassBadge>
          <GlassBadge variant="secondary" size="sm">
            J&T: {selectedProvince.jtCityCode}
          </GlassBadge>
        </div>
      )}
    </div>
  );
}
