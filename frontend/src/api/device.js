import api from './index'

export const assembleDevice = (data) => api.post('/devices/assemble', data)

export const getDevices = (params) => api.get('/devices', { params })

export const getDeviceBySn = (sn) => api.get(`/devices/${sn}`)
