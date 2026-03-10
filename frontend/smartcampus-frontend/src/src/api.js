import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8090/api",
});

// Device CRUD operations
export const getDevices = () => api.get("/devices");
export const getDeviceById = (id) => api.get(`/devices/${id}`);
export const createDevice = (device) => api.post("/devices", device);
export const updateDevice = (id, device) => api.put(`/devices/${id}`, device);
export const deleteDevice = (id) => api.delete(`/devices/${id}`);

// Property CRUD operations
export const getProperties = () => api.get("/properties");
export const getPropertyById = (id) => api.get(`/properties/${id}`);
export const createProperty = (property) => api.post("/properties", property);
export const updateProperty = (id, property) => api.put(`/properties/${id}`, property);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);

export default api;