import api from "../api/api";

export const getUnknownDevices = () => api.get("/unknown-devices");
export const ignoreUnknownDevice = (id) => api.post(`/unknown-devices/${id}/ignore`);
