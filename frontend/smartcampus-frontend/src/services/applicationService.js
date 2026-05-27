import api from "../api/api";

export const getApplications = () => api.get("/api/applications");

export const createApplication = (app) => api.post("/api/applications", app);

export const updateApplication = (id, app) => api.put(`/api/applications/${id}`, app);

export const deleteApplication = (id) => api.delete(`/api/applications/${id}`);

export const addDeviceToApp = (appId, deviceId) =>
  api.post(`/api/applications/${appId}/devices/${deviceId}`);

export const removeDeviceFromApp = (appId, deviceId) =>
  api.delete(`/api/applications/${appId}/devices/${deviceId}`);