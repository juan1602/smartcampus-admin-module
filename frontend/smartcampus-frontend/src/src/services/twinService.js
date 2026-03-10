import api from "../api.js";

export const getTwins = () => api.get("/twins");
export const getTwinById = (id) => api.get(`/twins/${id}`);
export const createTwin = (twin) => api.post("/twins", twin);
export const updateTwin = (id, twin) => api.put(`/twins/${id}`, twin);
export const deleteTwin = (id) => api.delete(`/twins/${id}`);
