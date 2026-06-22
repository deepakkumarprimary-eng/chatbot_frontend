import axios from "axios";

const BASE_URL = "http://localhost:8080/api/workflows";

export const WorkflowService = {
    getAll: () => axios.get(BASE_URL),
    getById: (id) => axios.get(`${BASE_URL}/${id}`),
    create: (payload) => axios.post(BASE_URL, payload, { headers: { "Content-Type": "application/json" } }),
    update: (id, payload) => axios.put(`${BASE_URL}/${id}`, payload, { headers: { "Content-Type": "application/json" } }),
    delete: (id) => axios.delete(`${BASE_URL}/${id}`),
};
