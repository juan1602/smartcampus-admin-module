import api, { createDevice, updateDevice, deleteDevice } from "../api.js";

export const getDevices = () => api.get("/devices");
export const getDeviceById = (id) => api.get(`/devices/${id}`);
export { createDevice, updateDevice, deleteDevice };
