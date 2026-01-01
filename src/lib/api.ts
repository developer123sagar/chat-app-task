const API_URL = process.env.NEXT_PUBLIC_API_URL;

// internal state for token
let currentToken: string | null = null;

export const setToken = (token: string | null) => {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }
};

export const getToken = (): string | null => {
  if (!currentToken && typeof window !== "undefined") {
    currentToken = localStorage.getItem("accessToken");
  }
  return currentToken;
};

// internal fetch wrapper
const fetchRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// auth APIs
export const register = async (
  email: string,
  password: string,
  name: string
) => {
  return fetchRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
};

export const login = async (email: string, password: string) => {
  return fetchRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getMe = async () => {
  return fetchRequest("/api/auth/me");
};

export const getUsers = async () => {
  return fetchRequest("/api/auth/users");
};

// message APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const batchInsertMessages = async (messages: any[]) => {
  return fetchRequest("/api/messages/batch", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
};

export const getMessages = async (
  limit: number = 50,
  beforeTimestamp?: string
) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (beforeTimestamp) {
    params.append("beforeTimestamp", beforeTimestamp);
  }

  return fetchRequest(`/api/messages?${params.toString()}`);
};

// export object for backward compatibility or grouped usage
export const apiClient = {
  setToken,
  getToken,
  register,
  login,
  getMe,
  getUsers,
  batchInsertMessages,
  getMessages,
};
