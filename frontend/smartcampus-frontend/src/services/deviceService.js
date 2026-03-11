import api from "../api/api";

export const getDevices = () => api.get("/devices");

export const createDevice = (device) => api.post("/devices", device);

export const updateDevice = (id, device) =>
  api.put(`/devices/${id}`, device);

export const deleteDevice = (id) =>
  api.delete(`/devices/${id}`);

export const assignProperties = (deviceId, propertyIds) => {
  return api.post(`/devices/${deviceId}/components`, propertyIds);
};

// actualizar valor de una propiedad writable
export const updatePropertyValue = (deviceId, propertyName, value) => {
  return api.post(`/devices/${deviceId}/property-value`, {
    propertyName,
    value
  });
};