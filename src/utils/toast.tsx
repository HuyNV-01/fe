import {
  ToastCard,
  type ToastCardProps,
} from "@/components/toast/custom-toast";
import { toast } from "sonner";

type ShowToastProps = Omit<ToastCardProps, "id">;

export const showCustomToast = (props: ShowToastProps) => {
  return toast.custom((id) => <ToastCard id={id} {...props} />);
};

export const showSuccessToast = (
  message: React.ReactNode,
  options?: Omit<ShowToastProps, "message" | "variant">,
) => {
  return showCustomToast({
    title: "Thành công",
    message,
    variant: "success",
    ...options,
  });
};

export const showErrorToast = (
  message: React.ReactNode,
  options?: Omit<ShowToastProps, "message" | "variant">,
) => {
  return showCustomToast({
    title: "Lỗi",
    message,
    variant: "error",
    ...options,
  });
};

export const showWarningToast = (
  message: React.ReactNode,
  options?: Omit<ShowToastProps, "message" | "variant">,
) => {
  return showCustomToast({
    title: "Cảnh báo",
    message,
    variant: "warning",
    ...options,
  });
};

export const showInfoToast = (
  message: React.ReactNode,
  options?: Omit<ShowToastProps, "message" | "variant">,
) => {
  return showCustomToast({
    title: "Thông tin",
    message,
    variant: "info",
    ...options,
  });
};
