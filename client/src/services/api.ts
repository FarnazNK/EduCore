// client/src/services/api.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Update tokens in store
        const { user } = useAuthStore.getState();
        if (user) {
          useAuthStore.getState().setAuth(user, newAccessToken, newRefreshToken);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service methods
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'STUDENT' | 'INSTRUCTOR';
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export const courseService = {
  getCourses: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    search?: string;
  }) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourse: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data: any) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: any) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  publishCourse: async (id: string) => {
    const response = await api.post(`/courses/${id}/publish`);
    return response.data;
  },

  getCourseReviews: async (id: string, page = 1) => {
    const response = await api.get(`/courses/${id}/reviews`, { params: { page } });
    return response.data;
  },
};

export const enrollmentService = {
  enrollInCourse: async (courseId: string) => {
    const response = await api.post('/enrollments', { courseId });
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my-courses');
    return response.data;
  },

  getEnrollment: async (courseId: string) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
  },

  dropCourse: async (enrollmentId: string) => {
    const response = await api.delete(`/enrollments/${enrollmentId}`);
    return response.data;
  },
};

export const progressService = {
  getLessonProgress: async (lessonId: string) => {
    const response = await api.get(`/progress/lesson/${lessonId}`);
    return response.data;
  },

  updateProgress: async (lessonId: string, data: { completed: boolean; watchTime: number }) => {
    const response = await api.post(`/progress/lesson/${lessonId}`, data);
    return response.data;
  },

  getCourseProgress: async (courseId: string) => {
    const response = await api.get(`/progress/course/${courseId}`);
    return response.data;
  },
};

export const assignmentService = {
  getAssignment: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  submitAssignment: async (assignmentId: string, data: { content: string; attachments?: string[] }) => {
    const response = await api.post(`/assignments/${assignmentId}/submit`, data);
    return response.data;
  },

  getMySubmission: async (assignmentId: string) => {
    const response = await api.get(`/assignments/${assignmentId}/my-submission`);
    return response.data;
  },
};

export const notificationService = {
  getNotifications: async (page = 1) => {
    const response = await api.get('/notifications', { params: { page } });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export const analyticsService = {
  getStudentAnalytics: async () => {
    const response = await api.get('/analytics/student');
    return response.data;
  },

  getInstructorAnalytics: async () => {
    const response = await api.get('/analytics/instructor');
    return response.data;
  },

  getCourseAnalytics: async (courseId: string) => {
    const response = await api.get(`/analytics/course/${courseId}`);
    return response.data;
  },
};
