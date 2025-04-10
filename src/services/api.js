import axios from 'axios'

// 安全获取 localStorage 的封装
const safeGetLocalStorage = (key) => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null
  } catch (error) {
    console.error('LocalStorage access error:', error)
    return null
  }
}

// 创建可配置的 Axios 实例
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
      
      // 添加请求标识（可选）
      config.metadata = { 
        startTime: new Date(),
        url: config.url
      }
      
      return config
    },
    error => {
      // 增强请求错误处理
      const errorWrapper = new Error(`Request failed: ${error.message}`)
      errorWrapper.type = 'REQUEST_ERROR'
      return Promise.reject(errorWrapper)
    }
  )


  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      // 添加注册成功检测
      if (response.config.url === '/auth/register') {
        console.debug('Registration successful')
      }
      // 记录响应时间（可选）
      if (response.config.metadata?.startTime) {
        const endTime = new Date()
        const duration = endTime - response.config.metadata.startTime
        console.debug(`API ${response.config.url} took ${duration}ms`)
      }
      
      // 统一响应格式处理
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      }
    },
    error => {
      // 增强错误处理
      const errorResponse = {
        success: false,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      }

      // 超时处理
      if (error.code === 'ECONNABORTED') {
        errorResponse.message = 'Request timeout'
        errorResponse.type = 'TIMEOUT_ERROR'
      }

      // 网络错误处理
      if (!error.response) {
        errorResponse.type = 'NETWORK_ERROR'
        errorResponse.message = 'Network connection error'
      }

      // 401 处理（建议通过事件机制通知应用层）
      if (error.response?.status === 401) {
        safeGetLocalStorage('token') && localStorage.removeItem('token')
        // 触发全局事件而不是直接跳转
        window.dispatchEvent(new Event('unauthorized'))
      }

      // 服务器错误处理
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
