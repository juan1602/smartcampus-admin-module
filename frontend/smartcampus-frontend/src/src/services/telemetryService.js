import api from "../api.js";

export const getTelemetry = () => api.get("/telemetry");
export const getTelemetryByDevice = (deviceId) => api.get(`/telemetry/device/${deviceId}`);
export const saveTelemetry = (telemetry) => api.post("/telemetry", telemetry);
