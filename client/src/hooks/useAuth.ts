import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    // Treat 401 (not logged in) as a successful `null` result rather than an
    // error. An errored query is always considered stale and refetches on every
    // mount, which caused an infinite /api/auth/user refetch loop on the public
    // home page. staleTime: Infinity keeps the resolved result from refetching.
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}