import api from "../api/api.js";

export const getTelemetry = () => api.get("/telemetry");
export const saveTelemetry = (telemetry) => api.post("/telemetry", telemetry);
// 🆕 NUEVO: filtra telemetría por id del dispositivo usando el endpoint /telemetry/device/{id}
export const getTelemetryByDevice = (deviceId) => api.get(`/telemetry/device/${deviceId}`);
