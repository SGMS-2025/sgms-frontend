import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  // timeout: 10000,
  // headers: {
  //   'Content-Type': 'application/json'
  // }
});
console.log('API URL:', API_URL);

// // Optional: Add interceptors for auth token, error handling...
// api.interceptors.request.use(
//   (config) => {
//     // const token = localStorage.getItem('token');
//     // if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     console.error('Axios error:', err);
//     return Promise.reject(err);
//   }
// );
