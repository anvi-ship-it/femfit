import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface AuthSession {
  authenticated: boolean;
  phone: string | null;
  demo: boolean;
}

const SESSION_QUERY_KEY = ["authSession"] as const;

async function fetchSession(): Promise<AuthSession> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Could not check the sign-in session.");
  return response.json() as Promise<AuthSession>;
}

export function useAuthSession() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    retry: false,
    staleTime: 30_000,
  });

  const signOut = async () => {
    const response = await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Could not sign out. Please try again.");
    queryClient.removeQueries({
      predicate: ({ queryKey }) => queryKey[0] !== "authSession",
    });
    queryClient.setQueryData<AuthSession>(SESSION_QUERY_KEY, {
      authenticated: false,
      phone: null,
      demo: false,
    });
  };

  return { ...query, session: query.data, signOut };
}
