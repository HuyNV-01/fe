import apiClient from "@/lib/http/axios-client";
import type { IDeliveryTrustEvaluation } from "@/types/crm";

export interface IStandalonePhoneAbuseReportPayload {
  shopId: string;
  rawPhone: string;
  reasonCode:
    | "BOM_HANG"
    | "BOOM_AO_SPAM"
    | "TU_CHOI_NHAN_NHIEU_LAN"
    | "SAI_SO_DIEN_THOAI"
    | "OTHER";
  reasonNote: string;
  carrierCode?: string;
  orderCode?: string;
  trackingNumber?: string;
  markBlacklisted?: boolean;
}

export interface IStandalonePhoneAbuseReportResponse {
  reportId: string;
  phoneMasked: string;
  trustEvaluation: IDeliveryTrustEvaluation;
}

export const submitStandalonePhoneAbuseReportApi = (
  payload: IStandalonePhoneAbuseReportPayload,
) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/crm/${shopId}/trust/report-phone`, body, {
    timeout: 25_000,
  });
};
