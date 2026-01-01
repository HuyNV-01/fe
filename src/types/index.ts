import type { ReactNode } from "react";

export type TLocale = "vi";

export type TStatusSlice = "idle" | "loading" | "failed" | "wait";

export type TProps = {
  children: ReactNode;
  params: { locale: string };
};

export type TLocaleProps = {
  children: ReactNode;
  defaultValue?: string;
  label: string;
  isPending?: boolean;
};

//interface

export interface IProps {
  children: ReactNode;
  params: { locale: string };
}

export interface IPageParams {
  id: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export type TSort = "ASC" | "DESC";
