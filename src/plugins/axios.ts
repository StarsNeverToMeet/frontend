import axios from 'axios'

// 全局默认配置
axios.defaults.baseURL = 'http://localhost:8080'
axios.defaults.timeout = 10000
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 请求拦截器
axios.interceptors.request.use(
    config => {
        // 可以在这里添加认证信息等
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
axios.interceptors.response.use(
    response => {
        return response
    },
    error => {
        // 错误处理
        return Promise.reject(error)
    }
)

export default axios