import axios from 'axios';

import {env} from '@config';

export const api = axios.create({
  baseURL: env.API_URL,
});
