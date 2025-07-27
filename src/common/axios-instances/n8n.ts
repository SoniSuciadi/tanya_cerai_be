import axios from 'axios';
import 'dotenv/config';

const config = {
  baseURL: process.env.N8N_ORIGIN,
};
const n8nAgent = axios.create(config);
export default n8nAgent;
