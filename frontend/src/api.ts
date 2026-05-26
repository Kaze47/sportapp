const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${res.status}: ${t}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  requestOtp: (phone: string) =>
    request<{ ok: boolean; mock_code: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string) =>
    request<{ user: any; is_new: boolean; token: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),
  updateProfile: (payload: any) =>
    request<any>("/users/profile", { method: "POST", body: JSON.stringify(payload) }),
  updateSports: (payload: any) =>
    request<any>("/users/sports", { method: "POST", body: JSON.stringify(payload) }),
  getUser: (id: string) => request<any>(`/users/${id}`),
  getUserHistory: (id: string) => request<any[]>(`/users/${id}/history`),
  listMatches: (sport?: string, when?: string) => {
    const q = new URLSearchParams();
    if (sport) q.set("sport", sport);
    if (when) q.set("when", when);
    return request<any[]>(`/matches?${q.toString()}`);
  },
  getMatch: (id: string) => request<any>(`/matches/${id}`),
  joinMatch: (id: string, user_id: string) =>
    request<any>(`/matches/${id}/join`, { method: "POST", body: JSON.stringify({ user_id }) }),
  createMatch: (payload: any) =>
    request<any>("/matches", { method: "POST", body: JSON.stringify(payload) }),
  listTeams: (sport?: string) =>
    request<any[]>(`/teams${sport ? `?sport=${sport}` : ""}`),
  getTeam: (id: string) => request<any>(`/teams/${id}`),
  createTeam: (payload: any) =>
    request<any>("/teams", { method: "POST", body: JSON.stringify(payload) }),
  listChats: (user_id: string, kind?: string) => {
    const q = new URLSearchParams({ user_id });
    if (kind) q.set("kind", kind);
    return request<any[]>(`/chats?${q.toString()}`);
  },
  getChat: (id: string) => request<any>(`/chats/${id}`),
  sendMessage: (chatId: string, payload: any) =>
    request<any>(`/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify(payload) }),
  suggestedContacts: () => request<any[]>("/contacts/suggested"),
  discoveryTryNew: () => request<any[]>("/discovery/try-new"),
  discoveryCompetitions: () => request<any[]>("/discovery/competitions"),
};
