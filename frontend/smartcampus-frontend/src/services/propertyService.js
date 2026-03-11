import api from "../api/api";

export const getProperties = () => api.get("/properties");

export const createProperty = (property) =>
  api.post("/properties", property);

export const updateProperty = (id, property) =>
  api.put(`/properties/${id}`, property);

export const deleteProperty = (id) =>
  api.delete(`/properties/${id}`);