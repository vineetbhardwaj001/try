import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// 🚀 Automatically remove 'Content-Type' for FormData
instance.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default instance;




/*import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://5cz083bb-5000.inc1.devtunnels.ms/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;*/

/**/

