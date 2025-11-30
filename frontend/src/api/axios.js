/**
 * Axios instance with centralized configuration
 * Reads API URL from VITE_API_URL environment variable
 */
import axios from 'axios'

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle errors (401 unauthorized, 402 payment required)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (error.response?.status === 402) {
      // Trial expired - trigger upgrade modal
      const event = new CustomEvent('trialExpired', {
        detail: {
          message: error.response?.data?.message || 'Your trial has ended. Please upgrade to continue.'
        }
      })
      window.dispatchEvent(event)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
