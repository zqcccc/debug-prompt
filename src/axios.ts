import axios from 'axios'

export const axiosInstance = axios.create({})

axiosInstance.interceptors.request.use((config) => {
  const key = localStorage.getItem('azure-key')
  if (key) config.headers['api-key'] = key
  return config
})
