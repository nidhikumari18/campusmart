
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/auth${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the CampusMart server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const authAPI = {
  register: (form) =>
    request("/register", {
      method: "POST",
      body: JSON.stringify(form),
    }),

  login: (form) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify(form),
    }),

  me: () => request("/me"),

  logout: () =>
    request("/logout", {
      method: "POST",
    }),
};
