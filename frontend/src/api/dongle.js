import api from './index'

export const syncDongle = (data) => api.post('/dongles/sync', data)

export const getDongles = (params) => api.get('/dongles', { params })

export const getDongleBySn = (sn) => api.get(`/dongles/${sn}`)
