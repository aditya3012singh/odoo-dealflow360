import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';
import { logout, setCredentials } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include', // Include httpOnly refresh token cookies
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Re-authentication wrapper for automatic refresh token rotation
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If token has expired (401 Unauthorized)
  if (result.error && result.error.status === 401) {
    // Attempt to refresh the access token via httpOnly cookie
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const responseData = refreshResult.data as any;
      if (responseData.success && responseData.data?.accessToken) {
        // Store new access token in Redux store
        api.dispatch(
          setCredentials({
            user: responseData.data.user,
            accessToken: responseData.data.accessToken,
          })
        );
        // Retry the original query with the refreshed token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Health', 'Auth'],
  endpoints: () => ({}),
});
