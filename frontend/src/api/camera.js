import api from './index'

export const syncCamera = (data) => api.post('/cameras/sync', data)

export const getCameras = (params) => api.get('/cameras', { params })

export const getCameraBySn = (sn) => api.get(`/cameras/${sn}`)
