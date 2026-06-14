import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AdminLoginInput, AdminStats, AuthToken, DeleteResponse, GetResultsParams, HealthStatus, QuizResult, QuizResultInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSharedResultUrl: (id: number) => string;
/**
 * @summary Get a shared quiz result (public, no auth)
 */
export declare const getSharedResult: (id: number, options?: RequestInit) => Promise<QuizResult>;
export declare const getGetSharedResultQueryKey: (id: number) => readonly [`/api/share/${number}`];
export declare const getGetSharedResultQueryOptions: <TData = Awaited<ReturnType<typeof getSharedResult>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSharedResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSharedResult>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSharedResultQueryResult = NonNullable<Awaited<ReturnType<typeof getSharedResult>>>;
export type GetSharedResultQueryError = ErrorType<void>;
/**
 * @summary Get a shared quiz result (public, no auth)
 */
export declare function useGetSharedResult<TData = Awaited<ReturnType<typeof getSharedResult>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSharedResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitResultUrl: () => string;
/**
 * @summary Submit a quiz result
 */
export declare const submitResult: (quizResultInput: QuizResultInput, options?: RequestInit) => Promise<QuizResult>;
export declare const getSubmitResultMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitResult>>, TError, {
        data: BodyType<QuizResultInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitResult>>, TError, {
    data: BodyType<QuizResultInput>;
}, TContext>;
export type SubmitResultMutationResult = NonNullable<Awaited<ReturnType<typeof submitResult>>>;
export type SubmitResultMutationBody = BodyType<QuizResultInput>;
export type SubmitResultMutationError = ErrorType<void>;
/**
* @summary Submit a quiz result
*/
export declare const useSubmitResult: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitResult>>, TError, {
        data: BodyType<QuizResultInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitResult>>, TError, {
    data: BodyType<QuizResultInput>;
}, TContext>;
export declare const getGetResultsUrl: (params?: GetResultsParams) => string;
/**
 * @summary Get all quiz results (admin only)
 */
export declare const getResults: (params?: GetResultsParams, options?: RequestInit) => Promise<QuizResult[]>;
export declare const getGetResultsQueryKey: (params?: GetResultsParams) => readonly ["/api/results", ...GetResultsParams[]];
export declare const getGetResultsQueryOptions: <TData = Awaited<ReturnType<typeof getResults>>, TError = ErrorType<void>>(params?: GetResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getResults>>>;
export type GetResultsQueryError = ErrorType<void>;
/**
 * @summary Get all quiz results (admin only)
 */
export declare function useGetResults<TData = Awaited<ReturnType<typeof getResults>>, TError = ErrorType<void>>(params?: GetResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetResultUrl: (id: number) => string;
/**
 * @summary Get a specific result
 */
export declare const getResult: (id: number, options?: RequestInit) => Promise<QuizResult>;
export declare const getGetResultQueryKey: (id: number) => readonly [`/api/results/${number}`];
export declare const getGetResultQueryOptions: <TData = Awaited<ReturnType<typeof getResult>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResult>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResultQueryResult = NonNullable<Awaited<ReturnType<typeof getResult>>>;
export type GetResultQueryError = ErrorType<void>;
/**
 * @summary Get a specific result
 */
export declare function useGetResult<TData = Awaited<ReturnType<typeof getResult>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteResultUrl: (id: number) => string;
/**
 * @summary Delete a result
 */
export declare const deleteResult: (id: number, options?: RequestInit) => Promise<DeleteResponse>;
export declare const getDeleteResultMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteResult>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteResult>>, TError, {
    id: number;
}, TContext>;
export type DeleteResultMutationResult = NonNullable<Awaited<ReturnType<typeof deleteResult>>>;
export type DeleteResultMutationError = ErrorType<void>;
/**
* @summary Delete a result
*/
export declare const useDeleteResult: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteResult>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteResult>>, TError, {
    id: number;
}, TContext>;
export declare const getAdminLoginUrl: () => string;
/**
 * @summary Admin login
 */
export declare const adminLogin: (adminLoginInput: AdminLoginInput, options?: RequestInit) => Promise<AuthToken>;
export declare const getAdminLoginMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<AdminLoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<AdminLoginInput>;
}, TContext>;
export type AdminLoginMutationResult = NonNullable<Awaited<ReturnType<typeof adminLogin>>>;
export type AdminLoginMutationBody = BodyType<AdminLoginInput>;
export type AdminLoginMutationError = ErrorType<void>;
/**
* @summary Admin login
*/
export declare const useAdminLogin: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<AdminLoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<AdminLoginInput>;
}, TContext>;
export declare const getGetAdminStatsUrl: () => string;
/**
 * @summary Get dashboard statistics
 */
export declare const getAdminStats: (options?: RequestInit) => Promise<AdminStats>;
export declare const getGetAdminStatsQueryKey: () => readonly ["/api/admin/stats"];
export declare const getGetAdminStatsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminStats>>>;
export type GetAdminStatsQueryError = ErrorType<void>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetAdminStats<TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExportResultsCsvUrl: () => string;
/**
 * @summary Export results as CSV
 */
export declare const exportResultsCsv: (options?: RequestInit) => Promise<string>;
export declare const getExportResultsCsvQueryKey: () => readonly ["/api/results/export/csv"];
export declare const getExportResultsCsvQueryOptions: <TData = Awaited<ReturnType<typeof exportResultsCsv>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportResultsCsv>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof exportResultsCsv>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ExportResultsCsvQueryResult = NonNullable<Awaited<ReturnType<typeof exportResultsCsv>>>;
export type ExportResultsCsvQueryError = ErrorType<void>;
/**
 * @summary Export results as CSV
 */
export declare function useExportResultsCsv<TData = Awaited<ReturnType<typeof exportResultsCsv>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportResultsCsv>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map