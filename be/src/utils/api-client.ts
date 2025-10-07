import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

const apiClient: AxiosInstance = axios.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
    },
});

function handleError(error: any) {
    if (error.response) {
        console.error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.data}`);
    } else if (error.request) {
        console.error('API Error: No response received');
    } else {
        console.error('API Error:', error.message);
    }
    throw error;
}

async function get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T> | undefined> {
    try {
        const config: AxiosRequestConfig = { params };
        const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(endpoint, config);
        return response.data;
    } catch (error) {
        handleError(error);
    }
}

async function post<T>(endpoint: string, data: Record<string, any>): Promise<ApiResponse<T> | undefined>  {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(endpoint, data);
        return response.data;
    } catch (error) {
        handleError(error);
    }
}

async function put<T>(endpoint: string, data: Record<string, any>): Promise<ApiResponse<T> | undefined> {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(endpoint, data);
        return response.data;
    } catch (error) {
        handleError(error);
    }
}

async function del<T>(endpoint: string): Promise<ApiResponse<T> | undefined> {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(endpoint);
        return response.data;
    } catch (error) {
        handleError(error);
    }
}

export { get, post, put, del };