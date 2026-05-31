import api from './index'

export const getTenants = (params) => api.get('/tenants', { params })

export const createTenant = (data) => api.post('/tenants', data)
