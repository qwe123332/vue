import axios from 'axios'

// 安全读取 localStorage（SSR 环境兼容）
const safeGetLocalStorage = (key) => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null
  } catch (error) {
    console.error('LocalStorage access error:', error)
    return null
  }
}

// 创建 Axios 实例
const createApiInstance = (options = {}) => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api',
    timeout: Number(import.meta.env.VITE_APP_API_TIMEOUT) || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    withCredentials: true
  })

  // 请求拦截器
  instance.interceptors.request.use(
      config => {
        const token = safeGetLocalStorage('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 请求元数据（记录时间）
        config.metadata = {
          startTime: new Date(),
          url: config.url
        }

        return config
      },
      error => {
        const err = new Error(`Request failed: ${error.message}`)
        err.type = 'REQUEST_ERROR'
        return Promise.reject(err)
      }
  )

  // 响应拦截器
  instance.interceptors.response.use(
      response => {
        const raw = response.data

        // API 结构判断与解包
        if (raw && typeof raw === 'object' && 'code' in raw) {
          if (raw.code === 200) {
            return raw.data // ✅ 只返回核心业务数据部分
          } else {
            const err = new Error(raw.message || '请求失败')
            err.type = 'RESPONSE_ERROR'
            err.code = raw.code
            err.fullResponse = raw
            return Promise.reject(err)
          }
        }

        // fallback：不符合结构的响应直接返回
        return raw
      },
      error => {
        const errorResponse = {
          success: false,
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data
        }

        if (error.code === 'ECONNABORTED') {
          errorResponse.message = '请求超时'
          errorResponse.type = 'TIMEOUT_ERROR'
        }

        if (!error.response) {
          errorResponse.type = 'NETWORK_ERROR'
          errorResponse.message = '网络连接异常'
        }

        if (error.response?.status === 401) {
          safeGetLocalStorage('token') && localStorage.removeItem('token')
          window.dispatchEvent(new Event('unauthorized'))
        }

        if (error.response?.status >= 500) {
          errorResponse.type = 'SERVER_ERROR'
        }

        return Promise.reject(errorResponse)
      }
  )

  return instance
}

// 创建默认实例
const api = createApiInstance()

// 扩展取消令牌功能
api.createCancelToken = axios.CancelToken.source

export default api
