import api from "../api.js";

export const getProperties = () => api.get("/properties");
export const getPropertyById = (id) => api.get(`/properties/${id}`);
export const createProperty = (property) => api.post("/properties", property);
export const updateProperty = (id, property) => api.put(`/properties/${id}`, property);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);
