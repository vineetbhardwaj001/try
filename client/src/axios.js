import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust for prod
  headers: {
    'Content-Type': 'application/json'
  }
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

