import { AuthFormValues, UserData } from "@/types/auth";
import { api } from ".";

export const signUpUser = (payload: AuthFormValues) =>
  api.post<UserData>("/api/auth/register", payload);

export const loginUser = (payload: AuthFormValues) =>
  api.post<UserData>("/api/auth/login", payload);

export const getUserInfo = () => api.get<UserData>("/api/auth/me");

export const getUsersList = () => api.get<UserData[]>("/api/auth/users");
