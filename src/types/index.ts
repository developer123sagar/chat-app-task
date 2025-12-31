import type { AxiosResponse } from "axios";
import type {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

// generic type for query options
export type TQueryOptions<
  TData,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey
> = UseQueryOptions<TData, TError, TData, TQueryKey>;

// generic type for mutation options
export type TMutationOptions<TData, TVariables, TError = Error> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  "mutationFn"
>;

export type MutationOptionsWithProgress<
  TData = unknown,
  TVariables = void
> = TMutationOptions<TData, TVariables> & {
  onProgress?: (progress: number, variables: TVariables) => void;
};

// generic type for those query which need `params` option
export type TQueryExtendsParamsOptions<
  TData,
  TQueryParams = Record<string, unknown>
> = Partial<
  TQueryOptions<TData, Record<string, unknown>> & {
    params: TQueryParams;
  }
>;
