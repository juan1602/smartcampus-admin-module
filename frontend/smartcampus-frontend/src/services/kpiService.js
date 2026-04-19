import api from "../api/api";

export const getDeviceStats = () => api.get("/devices/stats");
