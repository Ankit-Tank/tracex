const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const getToken = () => localStorage.getItem("tracex_token");
export const setToken = (token) => localStorage.setItem("tracex_token", token);
export const clearAuth = () => {
  localStorage.removeItem("tracex_token");
  localStorage.removeItem("tracex_officer");
};
export const getOfficer = () => {
  const data = localStorage.getItem("tracex_officer");
  return data ? JSON.parse(data) : null;
};
export const setOfficer = (officer) => {
  localStorage.setItem("tracex_officer", JSON.stringify(officer));
};

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is JSON object and not FormData, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expired or invalid credentials. Please log in.");
    }

    if (!response.ok) {
      let errorDetail = `Request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // Not JSON
      }
      const err = new Error(errorDetail);
      err.status = response.status;
      throw err;
    }

    // Check if response is PDF or JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      return response;
    }

    // Default to JSON
    return await response.json();
  } catch (err) {
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
