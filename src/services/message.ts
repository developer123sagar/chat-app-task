import { api } from ".";

export const getMessages = () => api.get("/api/messages");
export const postMessages = (payload: Record<string, unknown>) =>
  api.post("/api/messages/batch", payload);
