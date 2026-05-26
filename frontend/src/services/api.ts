import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add access token to requests
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('accessToken') ??
      localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    // If the response contains the { success: true, data: ... } envelope, unwrap it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        response.data = response.data.data;
      } else {
        return Promise.reject(new Error(response.data.message || 'API Error'));
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem('refreshToken') ??
          localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token, trigger logout event or simply throw
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth/refresh`, undefined, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const { accessToken, refreshToken: nextRefreshToken } = response.data.data;

        // Save new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('access_token', accessToken);
        if (nextRefreshToken) {
          localStorage.setItem('refreshToken', nextRefreshToken);
          localStorage.setItem('refresh_token', nextRefreshToken);
        }

        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
