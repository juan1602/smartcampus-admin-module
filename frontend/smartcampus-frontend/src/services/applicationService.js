import api from "../api/api";

export const getApplications = () => api.get("/applications");

export const createApplication = (app) => api.post("/applications", app);

export const updateApplication = (id, app) => api.put(`/applications/${id}`, app);

export const deleteApplication = (id) => api.delete(`/applications/${id}`);

export const addDeviceToApp = (appId, deviceId) =>
  api.post(`/applications/${appId}/devices/${deviceId}`);

export const removeDeviceFromApp = (appId, deviceId) =>
  api.delete(`/applications/${appId}/devices/${deviceId}`);