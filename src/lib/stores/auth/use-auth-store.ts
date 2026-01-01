import type { ActionCallbacks, TStoreStatus } from "@/types/store";
import type {
  IBaseResponse,
  ICallbackLogin,
  IForgotPassword,
  ILogin,
  ILoginResponse,
  ILoginThirdResponse,
  IRegister,
  IResetPassword,
  IVerifyOtp,
} from "@/types/common";
import {
  callbackLoginApi,
  forgotPasswordApi,
  loginApi,
  loginWithGoogleApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  verifyOtpApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IAuthState } from "@/types/state";

interface AuthActions {
  setStatus: (status: TStoreStatus) => void;
  resetState: () => void;

  setAccessToken: (token: string) => void;

  register: (payload: IRegister, cb?: ActionCallbacks) => Promise<void>;
  login: (payload: ILogin, cb?: ActionCallbacks) => Promise<void>;
  logout: (cb?: ActionCallbacks) => Promise<void>;

  forgotPassword: (
    payload: IForgotPassword,
    cb?: ActionCallbacks,
  ) => Promise<void>;
  verifyOtp: (payload: IVerifyOtp, cb?: ActionCallbacks) => Promise<void>;
  resetPassword: (
    payload: IResetPassword,
    cb?: ActionCallbacks,
  ) => Promise<void>;

  loginWithGoogle: (cb?: ActionCallbacks) => Promise<void>;
  callbackLoginThird: (
    payload: ICallbackLogin,
    cb?: ActionCallbacks,
  ) => Promise<void>;
}

export const useAuthStore = createPersistedStore<IAuthState & AuthActions>(
  (set, get) => ({
    currentAccount: undefined,
    value: undefined,
    status: "idle",
    authenticated: false,

    setStatus: (status) =>
      set((state) => {
        state.status = status;
      }),

    resetState: () =>
      set((state) => {
        state.currentAccount = undefined;
        state.value = undefined;
        state.status = "idle";
        state.authenticated = false;
      }),

    setAccessToken: (token: string) => {
      set((state) => {
        if (state.currentAccount) {
          state.currentAccount.accessToken = token;
          state.authenticated = true;
        }
      });
      localStorage.setItem("accessToken", token);
    },

    register: async (payload, cb) => {
      set((state) => {
        state.status = "loading";
      });
      try {
        const response = (await registerApi({
          data: payload,
        })) as unknown as IBaseResponse;
        if (response.status === 201) {
          set((state) => {
            state.status = "idle";
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    login: async (payload, cb) => {
      set((state) => {
        state.status = "loading";
      });
      try {
        const response = (await loginApi({
          data: payload,
        })) as unknown as ILoginResponse;
        if (response.status === 200) {
          set((state) => {
            state.currentAccount = response.data;
            state.authenticated = true;
            state.status = "idle";
          });

          localStorage.setItem("accessToken", response.data.accessToken);
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    logout: async (cb) => {
      set((state) => {
        state.status = "loading";
      });
      try {
        await logoutApi();
        cb?.onSuccess?.();
      } catch (error) {
      } finally {
        set((state) => {
          state.currentAccount = undefined;
          state.value = undefined;
          state.status = "idle";
          state.authenticated = false;
        });
        localStorage.clear();
      }
    },

    forgotPassword: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });
      try {
        const response = (await forgotPasswordApi({
          data: payload,
        })) as unknown as IBaseResponse;
        if (response.status === 200) {
          set((state) => {
            state.status = "idle";
            state.value = { email: payload.email };
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    verifyOtp: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });

      const currentEmail = get().value?.email;

      try {
        const response = (await verifyOtpApi({
          data: { email: currentEmail, otp: payload.otp },
        })) as unknown as IBaseResponse;

        if (response.status === 200) {
          set((state) => {
            state.status = "idle";
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    resetPassword: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });
      const currentEmail = get().value?.email;

      try {
        const response = (await resetPasswordApi({
          data: { email: currentEmail, newPassword: payload.newPassword },
        })) as unknown as IBaseResponse;

        if (response.status === 200) {
          set((state) => {
            state.status = "idle";
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    loginWithGoogle: async (cb) => {
      try {
        await loginWithGoogleApi();
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    callbackLoginThird: async (payload, cb) => {
      set((state) => {
        state.status = "loading";
      });
      localStorage.setItem("accessToken", payload.accessToken);

      try {
        const response =
          (await callbackLoginApi()) as unknown as ILoginThirdResponse;
        if (response.status === 200) {
          set((state) => {
            state.currentAccount = {
              user: response.data,
              accessToken: payload.accessToken,
            };
            state.authenticated = true;
            state.status = "idle";
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.data?.code || error.status);
      }
    },
  }),
  "auth-storage",
  {
    partialize: (state) =>
      ({
        value: state.value,
        authenticated: state.authenticated,
        currentAccount: state.currentAccount,
      }) as any,
  },
);
