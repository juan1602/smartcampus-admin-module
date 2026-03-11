import api from "../api/api.js";

export const getTelemetry = () => api.get("/telemetry");
export const saveTelemetry = (telemetry) => api.post("/telemetry", telemetry);
