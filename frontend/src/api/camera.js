import api from './index'

export const syncCamera = () => api.post('/cameras/sync')

export const getCameras = (params) => api.get('/cameras', { params })

export const getCameraBySn = (sn) => api.get(`/cameras/${sn}`)
