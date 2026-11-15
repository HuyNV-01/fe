"use client";

import { use, useEffect } from "react";
import { ButtonBack, GlassSectionHeader } from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import { Customer360Panel } from "@/components/crm/customer-360-panel";
import { UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Customer360DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const t = useTranslations("Crm360.detailPage");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const { activeCustomerDetail, fetchCustomer360Detail } = useCrmStore();
  const syntheticConvKey = `detail_${customerId}`;

  useEffect(() => {
    if (activeShopId && customerId) {
      fetchCustomer360Detail(activeShopId, customerId);
    }
  }, [activeShopId, customerId, fetchCustomer360Detail]);

  useEffect(() => {
    if (activeCustomerDetail?.customer) {
      useCrmStore.setState((state) => {
        state.customer360ByConv[syntheticConvKey] = activeCustomerDetail;
      });
    }
  }, [activeCustomerDetail, syntheticConvKey]);

  if (!activeShopId) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ButtonBack />
        <GlassSectionHeader
          icon={<UserCheck className="w-5 h-5" />}
          title={activeCustomerDetail?.customer?.fullName || t("defaultTitle")}
          subtitle={t("subtitle")}
        />
      </div>

      <Customer360Panel
        shopId={activeShopId}
        customerId={customerId}
        conversationId={syntheticConvKey}
      />
    </div>
  );
}
