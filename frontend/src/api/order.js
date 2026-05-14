import api from './index'

export const createOrder = (data) => api.post('/orders', data)

export const getOrders = (params) => api.get('/orders', { params })

export const getOrder = (id) => api.get(`/orders/${id}`)

export const confirmOrder = (id, data) => api.post(`/orders/${id}/confirm`, data)

export const payOrder = (id, data) => api.post(`/orders/${id}/pay`, data)

export const confirmPayment = (id, data) => api.post(`/orders/${id}/confirm-payment`, data)

export const shipOrder = (id, data) => api.post(`/orders/${id}/ship`, data)

export const receiveOrder = (id, data) => api.post(`/orders/${id}/receive`, data)
