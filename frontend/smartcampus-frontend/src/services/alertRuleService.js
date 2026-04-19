import api from "../api/api";

export const getAlertRules  = ()         => api.get("/alert-rules");
export const createAlertRule = (rule)    => api.post("/alert-rules", rule);
export const updateAlertRule = (id, rule) => api.put(`/alert-rules/${id}`, rule);
export const deleteAlertRule = (id)      => api.delete(`/alert-rules/${id}`);
