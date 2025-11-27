// Safe helpers for storing and retrieving pt_user in localStorage
export function getStoredUser() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem("pt_user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("getStoredUser: failed to parse pt_user", e, raw);
      return null;
    }
  } catch (e) {
    console.error("getStoredUser: localStorage unavailable", e);
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem("pt_user", JSON.stringify(user));
  } catch (e) {
    console.error("setStoredUser: failed to write pt_user", e);
  }
}

export function clearStoredUser() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.removeItem("pt_user");
  } catch (e) {
    console.error("clearStoredUser: failed to remove pt_user", e);
  }
}

export default { getStoredUser, setStoredUser, clearStoredUser };
