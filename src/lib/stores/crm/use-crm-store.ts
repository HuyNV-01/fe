import { createPersistedStore } from "../create-persisted-store";
import {
  getAdministrativeUnitsApi,
  extractVietnameseNerApi,
  listCustomersApi,
  getCustomer360ByConversationApi,
  getCustomer360DetailApi,
  createCustomerProfileApi,
  updateCustomerProfileApi,
  toggleCustomerBlacklistApi,
  overrideCustomerTrustScoreApi,
  mergeCustomerProfilesApi,
  unmaskCustomerPhoneApi,
  adjustCustomerWalletOrPointsApi,
  getRfmSegmentsApi,
  recalculateRfmSegmentsApi,
  listAdsConversionsApi,
  dispatchAdsConversionApi,
  retryAdsConversionApi,
  listSecurityAuditLogsApi,
  verifySecurityAuditChainApi,
} from "./api";
import type {
  AdsConversionEventNameType,
  AdsConversionPlatformType,
  CustomerTierType,
  CustomerWalletLedgerType,
  CustomerWalletTransactionType,
  IAdsConversionEventLog,
  ICustomerProfile,
  ICustomerWalletLedger,
  IExtractedCommerceEntities,
  IRfmSegmentSummary,
  ISecurityAuditLog,
  ISecurityChainVerificationResult,
  IUnmaskedPhoneSession,
  IVnProvinceUnit,
  RfmSegmentCodeType,
  SecurityAuditActionCodeType,
} from "@/types/crm";
import type { IConversation } from "@/types/chat";
import { toast } from "sonner";
import { tStore } from "@/i18n/translate-store";

const unmaskExpiryTimers = new Map<string, NodeJS.Timeout>();

interface CrmState {
  administrativeTree: IVnProvinceUnit[];
  customers: ICustomerProfile[];
  customersTotal: number;
  customersPage: number;
  isLoadingCustomers: boolean;

  customer360ByConv: Record<
    string,
    {
      customer: ICustomerProfile | null;
      walletLedgers: ICustomerWalletLedger[];
      linkedConversations: IConversation[];
    }
  >;
  activeCustomerDetail: {
    customer: ICustomerProfile | null;
    walletLedgers: ICustomerWalletLedger[];
    linkedConversations: IConversation[];
  } | null;

  unmaskedPhonesByCustomer: Record<string, IUnmaskedPhoneSession | null>;
  rfmSegments: IRfmSegmentSummary[];
  rfmTotalEvaluated: number;
  isRecalculatingRfm: boolean;

  adsConversionLogs: IAdsConversionEventLog[];
  adsConversionSummary: {
    totalEvents: number;
    leadSubmittedCount: number;
    initiateCheckoutCount: number;
    purchaseCount: number;
    totalPurchaseRevenue: number;
  } | null;

  securityAuditLogs: ISecurityAuditLog[];
  securityAuditTotal: number;
  chainVerificationResult: ISecurityChainVerificationResult | null;
  isVerifyingChain: boolean;

  fetchAdministrativeTree: (shopId: string) => Promise<void>;
  extractCommerceNer: (payload: {
    shopId: string;
    text: string;
    conversationId?: string;
    messageId?: string;
  }) => Promise<IExtractedCommerceEntities | null>;
  fetchCustomers: (params: {
    shopId: string;
    page?: number;
    limit?: number;
    search?: string;
    tier?: CustomerTierType;
    rfmSegment?: RfmSegmentCodeType;
    highRiskOnly?: boolean;
    blacklistedOnly?: boolean;
  }) => Promise<void>;
  fetchCustomer360ByConversation: (
    shopId: string,
    conversationId: string,
  ) => Promise<ICustomerProfile | null>;
  fetchCustomer360Detail: (
    shopId: string,
    customerId: string,
  ) => Promise<ICustomerProfile | null>;
  saveCustomerProfile: (payload: {
    shopId: string;
    customerId?: string | null;
    fullName: string;
    rawPhone?: string;
    email?: string;
    defaultProvinceCode?: string;
    defaultDistrictCode?: string;
    defaultWardCode?: string;
    defaultAddressLine?: string;
    tier?: CustomerTierType;
    heightCm?: number;
    weightKg?: number;
    preferredSize?: string;
    notes?: string;
    conversationId?: string;
  }) => Promise<ICustomerProfile | null>;
  toggleCustomerBlacklist: (payload: {
    shopId: string;
    customerId: string;
    isBlacklisted: boolean;
    blacklistReason?: string;
    conversationId?: string;
  }) => Promise<boolean>;
  overrideTrustScore: (payload: {
    shopId: string;
    customerId: string;
    deliveryTrustScore: number;
    successfulDeliveriesCount?: number;
    returnedOrdersCount?: number;
    reason: string;
    conversationId?: string;
  }) => Promise<boolean>;
  mergeCustomerProfiles: (payload: {
    shopId: string;
    primaryCustomerId: string;
    duplicateCustomerId: string;
    mergeReason?: string;
  }) => Promise<ICustomerProfile | null>;
  unmaskCustomerPhone15s: (payload: {
    shopId: string;
    customerId: string;
    reason?: string;
    conversationId?: string;
  }) => Promise<IUnmaskedPhoneSession | null>;
  clearUnmaskedPhone: (customerId: string) => void;
  adjustWalletOrPoints: (payload: {
    shopId: string;
    customerId: string;
    ledgerType: CustomerWalletLedgerType;
    transactionType: CustomerWalletTransactionType;
    deltaAmount: number;
    referenceOrderId?: string;
    note: string;
    conversationId?: string;
  }) => Promise<boolean>;
  fetchRfmSegments: (shopId: string) => Promise<void>;
  recalculateRfmSegments: (shopId: string) => Promise<void>;
  fetchAdsConversions: (
    shopId: string,
    conversationId?: string,
  ) => Promise<void>;
  dispatchAdsConversion: (payload: {
    shopId: string;
    platform: AdsConversionPlatformType;
    eventName: AdsConversionEventNameType;
    conversationId?: string;
    customerId?: string;
    channelIntegrationId?: string;
    orderId?: string;
    ctwaClickId?: string;
    sourceAdId?: string;
    valueAmount?: number;
    currency?: string;
    testEventCode?: string;
  }) => Promise<IAdsConversionEventLog | null>;
  retryAdsConversion: (shopId: string, logId: string) => Promise<boolean>;
  fetchSecurityAuditLogs: (params: {
    shopId: string;
    page?: number;
    limit?: number;
    actionCode?: SecurityAuditActionCodeType;
    actorUserId?: string;
  }) => Promise<void>;
  verifyAuditHashChain: (
    shopId: string,
  ) => Promise<ISecurityChainVerificationResult | null>;
  handleRealtimeCrmProfileUpdated: (payload: {
    conversationId: string;
    customer: ICustomerProfile;
  }) => void;
  handleRealtimeCapiEventDispatched: (payload: {
    conversationId: string;
    logId: string;
    platform: AdsConversionPlatformType;
    eventName: AdsConversionEventNameType;
    eventId: string;
    ctwaClickId?: string | null;
    sourceAdId?: string | null;
    valueAmount: number;
    currency: string;
    syncStatus:
      | "DISPATCHED_LIVE"
      | "SIMULATED_SANDBOX"
      | "QUEUED_RETRY"
      | "FAILED";
    syncedAt?: string;
  }) => void;
}

export const useCrmStore = createPersistedStore<CrmState>(
  (set, get) => ({
    administrativeTree: [],
    customers: [],
    customersTotal: 0,
    customersPage: 1,
    isLoadingCustomers: false,
    customer360ByConv: {},
    activeCustomerDetail: null,
    unmaskedPhonesByCustomer: {},
    rfmSegments: [],
    rfmTotalEvaluated: 0,
    isRecalculatingRfm: false,
    adsConversionLogs: [],
    adsConversionSummary: null,
    securityAuditLogs: [],
    securityAuditTotal: 0,
    chainVerificationResult: null,
    isVerifyingChain: false,

    fetchAdministrativeTree: async (shopId) => {
      if (!shopId || get().administrativeTree.length > 0) return;
      try {
        const res: any = await getAdministrativeUnitsApi(shopId);
        const tree: IVnProvinceUnit[] = res?.data?.data ?? res?.data ?? [];
        if (Array.isArray(tree) && tree.length > 0) {
          set({ administrativeTree: tree });
        }
      } catch {
        // Ignore
      }
    },

    extractCommerceNer: async (payload) => {
      try {
        const res: any = await extractVietnameseNerApi(payload);
        return (res?.data?.data ??
          res?.data ??
          null) as IExtractedCommerceEntities | null;
      } catch {
        return null;
      }
    },

    fetchCustomers: async (params) => {
      if (!params.shopId) return;
      set({ isLoadingCustomers: true });
      try {
        const res: any = await listCustomersApi(params);
        const data = res?.data?.data ?? res?.data ?? {};
        set({
          customers: Array.isArray(data.items) ? data.items : [],
          customersTotal: Number(data.total || 0),
          customersPage: Number(data.page || 1),
          isLoadingCustomers: false,
        });
      } catch {
        set({ isLoadingCustomers: false });
      }
    },

    fetchCustomer360ByConversation: async (shopId, conversationId) => {
      if (!shopId || !conversationId) return null;
      try {
        const res: any = await getCustomer360ByConversationApi(
          shopId,
          conversationId,
        );
        const data = res?.data?.data ?? res?.data;
        if (data?.customer) {
          set((state) => {
            state.customer360ByConv[conversationId] = {
              customer: data.customer,
              walletLedgers: data.walletLedgers || [],
              linkedConversations: data.linkedConversations || [],
            };
          });
          return data.customer as ICustomerProfile;
        }
        return null;
      } catch {
        return null;
      }
    },

    fetchCustomer360Detail: async (shopId, customerId) => {
      if (!shopId || !customerId) return null;
      try {
        const res: any = await getCustomer360DetailApi(shopId, customerId);
        const data = res?.data?.data ?? res?.data;
        if (data?.customer) {
          set({
            activeCustomerDetail: {
              customer: data.customer,
              walletLedgers: data.walletLedgers || [],
              linkedConversations: data.linkedConversations || [],
            },
          });
          return data.customer as ICustomerProfile;
        }
        return null;
      } catch {
        return null;
      }
    },

    saveCustomerProfile: async (payload) => {
      try {
        const { customerId, ...rest } = payload;
        const res: any = customerId
          ? await updateCustomerProfileApi({ ...rest, customerId })
          : await createCustomerProfileApi(rest);
        const saved: ICustomerProfile = res?.data?.data ?? res?.data;
        if (saved?.id) {
          set((state) => {
            const idx = state.customers.findIndex((c) => c.id === saved.id);
            if (idx !== -1) {
              state.customers[idx] = saved;
            } else {
              state.customers.unshift(saved);
            }
            if (payload.conversationId) {
              const prev = state.customer360ByConv[payload.conversationId];
              state.customer360ByConv[payload.conversationId] = {
                customer: saved,
                walletLedgers: prev?.walletLedgers || [],
                linkedConversations: prev?.linkedConversations || [],
              };
            }
            if (state.activeCustomerDetail?.customer?.id === saved.id) {
              state.activeCustomerDetail.customer = saved;
            }
          });
          toast.success(tStore("Crm360.toasts.profileSaved"));
          return saved;
        }
        return null;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || tStore("Crm360.toasts.actionFailed"),
        );
        return null;
      }
    },

    toggleCustomerBlacklist: async ({
      shopId,
      customerId,
      isBlacklisted,
      blacklistReason,
      conversationId,
    }) => {
      try {
        const res: any = await toggleCustomerBlacklistApi({
          shopId,
          customerId,
          isBlacklisted,
          blacklistReason,
        });
        const updated: ICustomerProfile = res?.data?.data ?? res?.data;
        if (updated?.id) {
          set((state) => {
            const idx = state.customers.findIndex((c) => c.id === updated.id);
            if (idx !== -1) state.customers[idx] = updated;
            if (
              conversationId &&
              state.customer360ByConv[conversationId]?.customer
            ) {
              state.customer360ByConv[conversationId].customer = updated;
            }
            if (state.activeCustomerDetail?.customer?.id === updated.id) {
              state.activeCustomerDetail.customer = updated;
            }
          });
          toast.success(
            isBlacklisted
              ? tStore("Crm360.toasts.blacklistedSuccess")
              : tStore("Crm360.toasts.unblacklistedSuccess"),
          );
          return true;
        }
        return false;
      } catch {
        toast.error(tStore("Crm360.toasts.actionFailed"));
        return false;
      }
    },

    overrideTrustScore: async ({
      shopId,
      customerId,
      deliveryTrustScore,
      successfulDeliveriesCount,
      returnedOrdersCount,
      reason,
      conversationId,
    }) => {
      try {
        const res: any = await overrideCustomerTrustScoreApi({
          shopId,
          customerId,
          deliveryTrustScore,
          successfulDeliveriesCount,
          returnedOrdersCount,
          reason,
        });
        const updated: ICustomerProfile = res?.data?.data ?? res?.data;
        if (updated?.id) {
          set((state) => {
            const idx = state.customers.findIndex((c) => c.id === updated.id);
            if (idx !== -1) state.customers[idx] = updated;
            if (
              conversationId &&
              state.customer360ByConv[conversationId]?.customer
            ) {
              state.customer360ByConv[conversationId].customer = updated;
            }
            if (state.activeCustomerDetail?.customer?.id === updated.id) {
              state.activeCustomerDetail.customer = updated;
            }
          });
          toast.success(tStore("Crm360.toasts.trustScoreUpdated"));
          return true;
        }
        return false;
      } catch {
        toast.error(tStore("Crm360.toasts.actionFailed"));
        return false;
      }
    },

    mergeCustomerProfiles: async (payload) => {
      try {
        const res: any = await mergeCustomerProfilesApi(payload);
        const merged: ICustomerProfile = res?.data?.data ?? res?.data;
        if (merged?.id) {
          set((state) => {
            state.customers = state.customers
              .filter((c) => c.id !== payload.duplicateCustomerId)
              .map((c) => (c.id === merged.id ? merged : c));
            if (state.activeCustomerDetail?.customer?.id === merged.id) {
              state.activeCustomerDetail.customer = merged;
            }
          });
          toast.success(tStore("Crm360.toasts.mergedSuccess"));
          return merged;
        }
        return null;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || tStore("Crm360.toasts.actionFailed"),
        );
        return null;
      }
    },

    unmaskCustomerPhone15s: async ({
      shopId,
      customerId,
      reason,
      conversationId,
    }) => {
      try {
        const res: any = await unmaskCustomerPhoneApi({
          shopId,
          customerId,
          reason,
          conversationId,
        });
        const session: IUnmaskedPhoneSession = res?.data?.data ?? res?.data;
        if (!session?.unmaskedPhone) return null;

        const existingTimer = unmaskExpiryTimers.get(customerId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        set((state) => {
          state.unmaskedPhonesByCustomer[customerId] = session;
        });

        const timer = setTimeout(
          () => {
            unmaskExpiryTimers.delete(customerId);
            set((state) => {
              delete state.unmaskedPhonesByCustomer[customerId];
            });
          },
          (session.expiresInSeconds || 15) * 1000,
        );

        unmaskExpiryTimers.set(customerId, timer);
        return session;
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.message ||
          tStore("Crm360.toasts.unmaskQuotaExceeded");
        toast.error(errMsg);
        return null;
      }
    },

    clearUnmaskedPhone: (customerId) => {
      const existingTimer = unmaskExpiryTimers.get(customerId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        unmaskExpiryTimers.delete(customerId);
      }
      set((state) => {
        delete state.unmaskedPhonesByCustomer[customerId];
      });
    },

    adjustWalletOrPoints: async ({
      shopId,
      customerId,
      ledgerType,
      transactionType,
      deltaAmount,
      referenceOrderId,
      note,
      conversationId,
    }) => {
      try {
        const res: any = await adjustCustomerWalletOrPointsApi({
          shopId,
          customerId,
          ledgerType,
          transactionType,
          deltaAmount,
          referenceOrderId,
          note,
        });
        const data = res?.data?.data ?? res?.data;
        if (data?.customer) {
          set((state) => {
            const idx = state.customers.findIndex((c) => c.id === customerId);
            if (idx !== -1) state.customers[idx] = data.customer;
            if (conversationId && state.customer360ByConv[conversationId]) {
              state.customer360ByConv[conversationId].customer = data.customer;
              if (data.ledgerEntry) {
                state.customer360ByConv[conversationId].walletLedgers.unshift(
                  data.ledgerEntry,
                );
              }
            }
            if (state.activeCustomerDetail?.customer?.id === customerId) {
              state.activeCustomerDetail.customer = data.customer;
              if (data.ledgerEntry) {
                state.activeCustomerDetail.walletLedgers.unshift(
                  data.ledgerEntry,
                );
              }
            }
          });
          toast.success(tStore("Crm360.toasts.walletAdjusted"));
          return true;
        }
        return false;
      } catch {
        toast.error(tStore("Crm360.toasts.actionFailed"));
        return false;
      }
    },

    fetchRfmSegments: async (shopId) => {
      if (!shopId) return;
      try {
        const res: any = await getRfmSegmentsApi(shopId);
        const data = res?.data?.data ?? res?.data;
        set({
          rfmSegments: Array.isArray(data?.segments) ? data.segments : [],
          rfmTotalEvaluated: Number(data?.totalCustomersEvaluated || 0),
        });
      } catch {
        // Ignore
      }
    },

    recalculateRfmSegments: async (shopId) => {
      if (!shopId) return;
      set({ isRecalculatingRfm: true });
      try {
        const res: any = await recalculateRfmSegmentsApi(shopId);
        const data = res?.data?.data ?? res?.data;
        set({
          rfmSegments: Array.isArray(data?.segments) ? data.segments : [],
          rfmTotalEvaluated: Number(data?.totalCustomersEvaluated || 0),
          isRecalculatingRfm: false,
        });
        toast.success(tStore("Crm360.toasts.rfmRecalculated"));
      } catch {
        set({ isRecalculatingRfm: false });
        toast.error(tStore("Crm360.toasts.actionFailed"));
      }
    },

    fetchAdsConversions: async (shopId, conversationId) => {
      if (!shopId) return;
      try {
        const res: any = await listAdsConversionsApi({
          shopId,
          conversationId,
        });
        const data = res?.data?.data ?? res?.data;
        set({
          adsConversionLogs: Array.isArray(data?.items) ? data.items : [],
          adsConversionSummary: data?.summary || null,
        });
      } catch {
        // Ignore
      }
    },

    dispatchAdsConversion: async (payload) => {
      try {
        const res: any = await dispatchAdsConversionApi(payload);
        const log: IAdsConversionEventLog = res?.data?.data ?? res?.data;
        if (log?.id) {
          set((state) => {
            state.adsConversionLogs.unshift(log);
          });
          toast.success(
            tStore("Crm360.toasts.capiDispatched", {
              eventName: log.eventName,
            }),
          );
          return log;
        }
        return null;
      } catch {
        toast.error(tStore("Crm360.toasts.actionFailed"));
        return null;
      }
    },

    retryAdsConversion: async (shopId, logId) => {
      try {
        const res: any = await retryAdsConversionApi(shopId, logId);
        const updated: IAdsConversionEventLog = res?.data?.data ?? res?.data;
        if (updated?.id) {
          set((state) => {
            const idx = state.adsConversionLogs.findIndex(
              (l) => l.id === updated.id,
            );
            if (idx !== -1) state.adsConversionLogs[idx] = updated;
          });
          toast.success(tStore("Crm360.toasts.capiRetried"));
          return true;
        }
        return false;
      } catch {
        toast.error(tStore("Crm360.toasts.actionFailed"));
        return false;
      }
    },

    fetchSecurityAuditLogs: async (params) => {
      if (!params.shopId) return;
      try {
        const res: any = await listSecurityAuditLogsApi(params);
        const data = res?.data?.data ?? res?.data;
        set({
          securityAuditLogs: Array.isArray(data?.items) ? data.items : [],
          securityAuditTotal: Number(data?.total || 0),
        });
      } catch {
        // Ignore
      }
    },

    verifyAuditHashChain: async (shopId) => {
      if (!shopId) return null;
      set({ isVerifyingChain: true });
      try {
        const res: any = await verifySecurityAuditChainApi(shopId);
        const result: ISecurityChainVerificationResult =
          res?.data?.data ?? res?.data;
        set({
          chainVerificationResult: result,
          isVerifyingChain: false,
        });
        if (result?.isValidChain) {
          toast.success(tStore("Crm360.toasts.auditChainValid"));
        } else {
          toast.error(tStore("Crm360.toasts.auditChainTampered"));
        }
        return result;
      } catch {
        set({ isVerifyingChain: false });
        return null;
      }
    },

    handleRealtimeCrmProfileUpdated: ({ conversationId, customer }) => {
      if (!customer?.id) return;
      set((state) => {
        const idx = state.customers.findIndex((c) => c.id === customer.id);
        if (idx !== -1) {
          state.customers[idx] = customer;
        } else {
          state.customers.unshift(customer);
        }
        if (conversationId) {
          const prev = state.customer360ByConv[conversationId];
          state.customer360ByConv[conversationId] = {
            customer,
            walletLedgers: prev?.walletLedgers || [],
            linkedConversations: prev?.linkedConversations || [],
          };
        }
      });
    },

    handleRealtimeCapiEventDispatched: (payload) => {
      set((state) => {
        const exists = state.adsConversionLogs.some(
          (l) => l.id === payload.logId,
        );
        if (!exists) {
          state.adsConversionLogs.unshift({
            id: payload.logId,
            shopId: "",
            conversationId: payload.conversationId,
            platform: payload.platform,
            eventName: payload.eventName,
            eventId: payload.eventId,
            ctwaClickId: payload.ctwaClickId,
            sourceAdId: payload.sourceAdId,
            valueAmount: payload.valueAmount,
            currency: payload.currency,
            syncStatus: payload.syncStatus,
            responseStatus: 200,
            retryCount: 0,
            syncedAt: payload.syncedAt || new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      });
    },
  }),
  "crm-360-storage",
  {
    partialize: (state) =>
      ({
        administrativeTree: state.administrativeTree,
      }) as any,
  },
);
