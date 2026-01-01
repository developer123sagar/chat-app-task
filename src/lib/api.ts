const API_URL = process.env.NEXT_PUBLIC_API_URL;

class APIClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("accessToken");
    }
    return this.token;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }

  // Auth APIs
  async register(email: string, password: string, name: string) {
    return this.fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.fetch("/api/auth/me");
  }

  async getUsers() {
    return this.fetch("/api/auth/users");
  }

  // Message APIs
  async batchInsertMessages(messages: any[]) {
    return this.fetch("/api/messages/batch", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  async getMessages(limit: number = 50, beforeTimestamp?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (beforeTimestamp) {
      params.append("beforeTimestamp", beforeTimestamp);
    }

    return this.fetch(`/api/messages?${params.toString()}`);
  }
}

export const apiClient = new APIClient();
