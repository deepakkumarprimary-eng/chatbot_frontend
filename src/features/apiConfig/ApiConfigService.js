import axios from "axios";
import { API_BASE_URL } from "../../api/index.js";

const BASE_URL = `${API_BASE_URL}/api/api-configs`;

export const ApiConfigService = {
  getAll:    ()            => axios.get(BASE_URL),
  getById:   (id)          => axios.get(`${BASE_URL}/${id}`),
  create:    (payload)     => axios.post(BASE_URL, payload, { headers: { "Content-Type": "application/json" } }),
  update:    (id, payload) => axios.put(`${BASE_URL}/${id}`, payload, { headers: { "Content-Type": "application/json" } }),
  delete:    (id)          => axios.delete(`${BASE_URL}/${id}`),
};
