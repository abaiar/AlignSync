import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 501) {
        error._userMessage = '该功能尚未实现，数据库逻辑待人工编写'
      } else if (status === 422) {
        error._userMessage = `数据校验失败: ${data.detail || '请检查输入'}`
      } else if (status === 404) {
        error._userMessage = '请求的资源不存在'
      } else if (status >= 500) {
        error._userMessage = '服务器内部错误，请稍后重试'
      } else {
        error._userMessage = data.detail || `请求失败 (${status})`
      }
    } else if (error.request) {
      error._userMessage = '网络连接失败，请检查后端服务是否启动'
    } else {
      error._userMessage = error.message || '未知错误'
    }
    return Promise.reject(error)
  },
)

export default api
