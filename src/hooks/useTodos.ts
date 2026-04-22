import { useQuery } from "@tanstack/react-query";
import { getTodos } from "../lib/api";

export const TODOS_QUERY_KEY = ["todos"] as const;

export function useTodos() {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: getTodos,
  });
}

export default useTodos;
