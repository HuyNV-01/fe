import type { ActionCallbacks, TStoreStatus } from "@/types/store";
import type {
  IBaseResponse,
  ICallbackLogin,
  IForgotPassword,
  ILogin,
  ILoginResponse,
  ILoginThirdResponse,
  IRegister,
  IResendActivation,
  IResetPassword,
  IUserRes,
  IVerifyOtp,
  IVerifyOtpResponse,
} from "@/types/common";
import {
  callbackLoginApi,
  forgotPasswordApi,
  loginApi,
  loginWithGoogleApi,
  logoutApi,
  registerApi,
  resendActivationApi,
  resetPasswordApi,
  verifyOtpApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IAuthState } from "@/types/state";
import { socketService } from "@/services/socket/socket-client";

interface AuthActions {
  setStatus: (status: TStoreStatus) => void;
  resetState: () => void;

  setAccessToken: (token: string) => void;
  updateCurrentUser: (patch: Partial<IUserRes>) => void;

  register: (payload: IRegister, cb?: ActionCallbacks) => Promise<void>;
  resendActivation: (
    payload: IResendActivation,
    cb?: ActionCallbacks,
  ) => Promise<void>;
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
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
      }
    },

    updateCurrentUser: (patch: Partial<IUserRes>) => {
      set((state) => {
        if (state.currentAccount?.user) {
          state.currentAccount.user = {
            ...state.currentAccount.user,
            ...patch,
          };
        }
      });
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
      } finally {
        cb?.onFinally?.();
      }
    },

    resendActivation: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });
      try {
        const response = (await resendActivationApi({
          data: payload,
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
      } finally {
        cb?.onFinally?.();
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

          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", response.data.accessToken);
          }
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      } finally {
        cb?.onFinally?.();
      }
    },

    logout: async (cb) => {
      set((state) => {
        state.status = "loading";
      });
      try {
        socketService.disconnectAll();
        await logoutApi();
        cb?.onSuccess?.();
      } catch {
        // Ignore network errors on logout
      } finally {
        set((state) => {
          state.currentAccount = undefined;
          state.value = undefined;
          state.status = "idle";
          state.authenticated = false;
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("chat-storage");
        }
        cb?.onFinally?.();
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
      } finally {
        cb?.onFinally?.();
      }
    },

    verifyOtp: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });

      const currentEmail = payload.email || get().value?.email;

      try {
        const response = (await verifyOtpApi({
          data: { email: currentEmail, otp: payload.otp },
        })) as unknown as IVerifyOtpResponse;

        if (response.status === 200) {
          set((state) => {
            state.status = "idle";
            state.value = {
              ...state.value,
              email: currentEmail,
              resetToken: response.data?.resetToken,
            };
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      } finally {
        cb?.onFinally?.();
      }
    },

    resetPassword: async (payload, cb) => {
      set((state) => {
        state.status = "wait";
      });
      const currentEmail = payload.email || get().value?.email;
      const currentResetToken = payload.resetToken || get().value?.resetToken;

      try {
        const response = (await resetPasswordApi({
          data: {
            email: currentEmail,
            newPassword: payload.newPassword,
            ...(currentResetToken ? { resetToken: currentResetToken } : {}),
          },
        })) as unknown as IBaseResponse;

        if (response.status === 200) {
          set((state) => {
            state.status = "idle";
            state.value = undefined;
          });
          cb?.onSuccess?.(response.code);
        }
      } catch (error: any) {
        set((state) => {
          state.status = "failed";
        });
        cb?.onError?.(error.response?.data?.code || error.status);
      } finally {
        cb?.onFinally?.();
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
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", payload.accessToken);
      }

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
        cb?.onError?.(
          error.response?.data?.code ||
            error.response?.data?.data?.code ||
            error.status,
        );
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
