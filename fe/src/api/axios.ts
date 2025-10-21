//axios.ts

import Axios, {type AxiosError, type AxiosResponse} from 'axios'
import { getAuthToken} from "./api.helpers.ts";

export function setupAxios(axios: any) {
    axios.defaults.headers.Accept = 'application/json'
    axios.interceptors.request.use(
        (config: { headers: any, method: string, data: any }) => {
            const auth = getAuthToken()
            if (auth) {
                config.headers['Authorization'] = `Bearer ${auth}`
            }

            return config
        },
        (err: any) => Promise.reject(err)
    )
    axios.interceptors.response.use(
        function (response: AxiosResponse) {
            if (response && response.data) {
                try {
                    const dataDecrypted = response.data
                    // xử lí thêm res ở đây
                    return Promise.resolve(dataDecrypted)
                } catch (error) {
                    console.log(error)
                    return Promise.reject({})
                }
            }
            return Promise.resolve(response)
        },
        function (error: AxiosError<any>) {
            if (error.response && error.response.data) {
                if (error.response.status === 429) {
                    return Promise.reject({ message: 'Thao tác quá nhanh, vui lòng thử lại sau 1 phút' })
                }
                try {
                    // xử lí thêm res error
                    const dataDecrypted = error.response.data

                    return Promise.reject(dataDecrypted)
                } catch (exception) {
                    console.log(exception)
                    return Promise.reject({ message: 'Có lỗi xảy ra, vui lòng chụp ảnh màn hình và gửi cho ADMIN - ' + exception })
                }
            }
            return Promise.reject(error.response)
        }
    )
}

const axios = Axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8888/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

setupAxios(axios)

export default axios