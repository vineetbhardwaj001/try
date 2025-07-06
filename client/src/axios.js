import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true  // ✅ must match backend config
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

