"use client";

import { useMemo, useState } from "react";
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
import type { IVnProvinceUnit } from "@/types/crm";
import {
  Check,
  ChevronsUpDown,
  MapPin,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu phục vụ tìm kiếm nhanh Tỉnh/Huyện/Xã trong Command (cmdk)
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
 * Cây hành chính Việt Nam dự phòng chuẩn 4 hãng vận chuyển (GHN, GHTK, ViettelPost, J&T)
 * đảm bảo Combobox luôn hoạt động mượt ngay cả khi API danh mục đang tải hoặc chạy chế độ offline
 */
const DEFAULT_FALLBACK_ADMINISTRATIVE_TREE: IVnProvinceUnit[] = [
  {
    code: "01",
    name: "Thành phố Hà Nội",
    aliases: ["ha noi", "hn", "hanoi", "tp ha noi", "thủ đô hà nội"],
    ghnProvinceId: 201,
    ghtkProvinceName: "Hà Nội",
    vtpProvinceId: 1,
    jtCityCode: "HNI",
    districts: [
      {
        code: "001",
        name: "Quận Ba Đình",
        aliases: ["ba dinh", "q ba dinh", "quan ba dinh"],
        ghnDistrictId: 1484,
        ghtkDistrictName: "Quận Ba Đình",
        wards: [
          {
            code: "00001",
            name: "Phường Phúc Xá",
            aliases: ["phuc xa", "p phuc xa"],
            ghnWardCode: "1A0101",
            ghtkWardName: "Phường Phúc Xá",
          },
          {
            code: "00004",
            name: "Phường Trúc Bạch",
            aliases: ["truc bach", "p truc bach"],
            ghnWardCode: "1A0102",
            ghtkWardName: "Phường Trúc Bạch",
          },
          {
            code: "00006",
            name: "Phường Vĩnh Phúc",
            aliases: ["vinh phuc", "p vinh phuc"],
            ghnWardCode: "1A0103",
            ghtkWardName: "Phường Vĩnh Phúc",
          },
        ],
      },
      {
        code: "005",
        name: "Quận Cầu Giấy",
        aliases: ["cau giay", "q cau giay", "quan cau giay", "cg"],
        ghnDistrictId: 1485,
        ghtkDistrictName: "Quận Cầu Giấy",
        wards: [
          {
            code: "00157",
            name: "Phường Dịch Vọng",
            aliases: ["dich vong", "p dich vong"],
            ghnWardCode: "1A0601",
            ghtkWardName: "Phường Dịch Vọng",
          },
          {
            code: "00166",
            name: "Phường Dịch Vọng Hậu",
            aliases: ["dich vong hau", "p dich vong hau", "dvh"],
            ghnWardCode: "1A0602",
            ghtkWardName: "Phường Dịch Vọng Hậu",
          },
          {
            code: "00169",
            name: "Phường Mai Dịch",
            aliases: ["mai dich", "p mai dich"],
            ghnWardCode: "1A0603",
            ghtkWardName: "Phường Mai Dịch",
          },
          {
            code: "00175",
            name: "Phường Trung Hòa",
            aliases: ["trung hoa", "p trung hoa"],
            ghnWardCode: "1A0607",
            ghtkWardName: "Phường Trung Hòa",
          },
        ],
      },
      {
        code: "006",
        name: "Quận Đống Đa",
        aliases: ["dong da", "q dong da", "quan dong da"],
        ghnDistrictId: 1486,
        ghtkDistrictName: "Quận Đống Đa",
        wards: [
          {
            code: "00199",
            name: "Phường Láng Hạ",
            aliases: ["lang ha", "p lang ha"],
            ghnWardCode: "1A0406",
            ghtkWardName: "Phường Láng Hạ",
          },
          {
            code: "00202",
            name: "Phường Láng Thượng",
            aliases: ["lang thuong", "p lang thuong"],
            ghnWardCode: "1A0407",
            ghtkWardName: "Phường Láng Thượng",
          },
          {
            code: "00229",
            name: "Phường Trung Liệt",
            aliases: ["trung liet", "p trung liet"],
            ghnWardCode: "1A0416",
            ghtkWardName: "Phường Trung Liệt",
          },
        ],
      },
      {
        code: "009",
        name: "Quận Thanh Xuân",
        aliases: ["thanh xuan", "q thanh xuan", "tx"],
        ghnDistrictId: 1493,
        ghtkDistrictName: "Quận Thanh Xuân",
        wards: [
          {
            code: "00343",
            name: "Phường Nhân Chính",
            aliases: ["nhan chinh", "p nhan chinh"],
            ghnWardCode: "1A0905",
            ghtkWardName: "Phường Nhân Chính",
          },
          {
            code: "00355",
            name: "Phường Khương Trung",
            aliases: ["khuong trung", "p khuong trung"],
            ghnWardCode: "1A0904",
            ghtkWardName: "Phường Khương Trung",
          },
        ],
      },
    ],
  },
  {
    code: "79",
    name: "Thành phố Hồ Chí Minh",
    aliases: ["ho chi minh", "hcm", "tphcm", "sai gon", "sg", "tp hcm"],
    ghnProvinceId: 202,
    ghtkProvinceName: "TP. Hồ Chí Minh",
    vtpProvinceId: 2,
    jtCityCode: "SGN",
    districts: [
      {
        code: "760",
        name: "Quận 1",
        aliases: ["quan 1", "q1", "q 1"],
        ghnDistrictId: 1442,
        ghtkDistrictName: "Quận 1",
        wards: [
          {
            code: "26734",
            name: "Phường Tân Định",
            aliases: ["tan dinh", "p tan dinh"],
            ghnWardCode: "20101",
            ghtkWardName: "Phường Tân Định",
          },
          {
            code: "26740",
            name: "Phường Bến Nghé",
            aliases: ["ben nghe", "p ben nghe"],
            ghnWardCode: "20102",
            ghtkWardName: "Phường Bến Nghé",
          },
          {
            code: "26743",
            name: "Phường Bến Thành",
            aliases: ["ben thanh", "p ben thanh"],
            ghnWardCode: "20103",
            ghtkWardName: "Phường Bến Thành",
          },
        ],
      },
      {
        code: "769",
        name: "Thành phố Thủ Đức",
        aliases: ["thu duc", "tp thu duc", "quan 2", "quan 9"],
        ghnDistrictId: 3695,
        ghtkDistrictName: "TP. Thủ Đức",
        wards: [
          {
            code: "26839",
            name: "Phường Hiệp Bình Chánh",
            aliases: ["hiep binh chanh", "hbc"],
            ghnWardCode: "90737",
            ghtkWardName: "Phường Hiệp Bình Chánh",
          },
          {
            code: "27088",
            name: "Phường Thảo Điền",
            aliases: ["thao dien", "p thao dien"],
            ghnWardCode: "20201",
            ghtkWardName: "Phường Thảo Điền",
          },
        ],
      },
      {
        code: "766",
        name: "Quận Tân Bình",
        aliases: ["tan binh", "q tan binh", "tb"],
        ghnDistrictId: 1454,
        ghtkDistrictName: "Quận Tân Bình",
        wards: [
          {
            code: "26965",
            name: "Phường 2",
            aliases: ["phuong 2", "p2", "p 2"],
            ghnWardCode: "21302",
            ghtkWardName: "Phường 2",
          },
          {
            code: "26998",
            name: "Phường 13",
            aliases: ["phuong 13", "p13", "p 13"],
            ghnWardCode: "21313",
            ghtkWardName: "Phường 13",
          },
        ],
      },
    ],
  },
  {
    code: "48",
    name: "Thành phố Đà Nẵng",
    aliases: ["da nang", "dn", "tp da nang"],
    ghnProvinceId: 203,
    ghtkProvinceName: "Đà Nẵng",
    vtpProvinceId: 3,
    jtCityCode: "DAD",
    districts: [
      {
        code: "492",
        name: "Quận Hải Châu",
        aliases: ["hai chau", "q hai chau"],
        ghnDistrictId: 1526,
        ghtkDistrictName: "Quận Hải Châu",
        wards: [
          {
            code: "20227",
            name: "Phường Hải Châu I",
            aliases: ["hai chau 1", "hai chau i"],
            ghnWardCode: "40103",
            ghtkWardName: "Phường Hải Châu I",
          },
          {
            code: "20242",
            name: "Phường Hòa Thuận Tây",
            aliases: ["hoa thuan tay"],
            ghnWardCode: "40108",
            ghtkWardName: "Phường Hòa Thuận Tây",
          },
        ],
      },
    ],
  },
];

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
  const nestingLevel = useGlassNestingLevel();
  const isOverGlass = nestingLevel > 0;

  const [openProv, setOpenProv] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  const effectiveTree = useMemo(
    () =>
      Array.isArray(administrativeTree) && administrativeTree.length > 0
        ? administrativeTree
        : DEFAULT_FALLBACK_ADMINISTRATIVE_TREE,
    [administrativeTree],
  );

  const selectedProvince = useMemo(
    () => effectiveTree.find((p) => p.code === provinceCode) || null,
    [effectiveTree, provinceCode],
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
          <LiquidPopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchProvincePlaceholder")} />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {effectiveTree.map((prov) => {
                    const aliasesStr = Array.isArray(prov.aliases)
                      ? prov.aliases.join(" ")
                      : "";
                    const searchValue = `${prov.name} ${normalizeVietnameseSearchText(prov.name)} ${aliasesStr} ${prov.code}`;
                    const isSelected = provinceCode === prov.code;

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
                          });
                          setOpenProv(false);
                          // Tự động mở tiếp Quận/Huyện để nhân viên chốt đơn thao tác liền mạch 1 chạm
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
                        <span className="truncate flex-1">{prov.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1.5 shrink-0">
                          {prov.jtCityCode}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </LiquidPopoverContent>
        </LiquidPopover>

        {/* 2. Chọn Quận / Huyện */}
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
          <LiquidPopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchDistrictPlaceholder")} />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
                <CommandGroup>
                  {districts.map((dist) => {
                    const aliasesStr = Array.isArray(dist.aliases)
                      ? dist.aliases.join(" ")
                      : "";
                    const searchValue = `${dist.name} ${normalizeVietnameseSearchText(dist.name)} ${aliasesStr} ${dist.code}`;
                    const isSelected = districtCode === dist.code;

                    return (
                      <CommandItem
                        key={dist.code}
                        value={searchValue}
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
                          // Tự động mở tiếp Phường/Xã sau khi chọn Quận/Huyện
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
                        <span className="truncate flex-1">{dist.name}</span>
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

        {/* 3. Chọn Phường / Xã */}
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
          <LiquidPopoverContent className="w-72 p-0" align="end">
            <Command>
              <CommandInput placeholder={t("searchWardPlaceholder")} />
              <CommandList className="max-h-64 overflow-y-auto p-1">
                <CommandEmpty>{t("noUnitFound")}</CommandEmpty>
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
                          });
                          setOpenWard(false);
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
      </div>

      {/* Hiển thị mã vùng ánh xạ sẵn 4 hãng vận chuyển (GHN, GHTK, ViettelPost, J&T) */}
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
            </GlassBadge>
            <GlassBadge variant="secondary" size="sm">
              VTP: #{selectedProvince.vtpProvinceId} • J&T:{" "}
              {selectedProvince.jtCityCode}
            </GlassBadge>
            {selectedWard && (
              <GlassBadge variant="success" size="sm">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                {t("autoMatchedBadge")}
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
