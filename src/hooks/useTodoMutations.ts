import type { Todo } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTodo as apiCreate,
  updateTodo as apiUpdate,
  deleteTodo as apiDelete,
} from "../lib/api";
import { TODOS_QUERY_KEY } from "./useTodos";

export function useTodoMutations(onAdded?: (title: string) => void) {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (title: string) => apiCreate({ title, completed: false }),
    onMutate: async (title: string) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      const optimistic: Todo = {
        id: `local-${Date.now()}`,
        title,
        completed: false,
        updatedAt: Date.now(),
        synced: false,
      };

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) => [
        optimistic,
        ...old,
      ]);
      return { previous, optimistic };
    },
    onError: (_err, _title, ctx) => {
      queryClient.setQueryData(TODOS_QUERY_KEY, ctx?.previous);
    },
    onSuccess: (created, _title, ctx) => {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((t) => (t.id === ctx?.optimistic.id ? created : t)),
      );
      if (onAdded) onAdded(created.title);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (todo: Todo) => apiUpdate(todo),
    onMutate: async (updated: Todo) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((t) =>
          t.id === updated.id ? { ...updated, synced: false } : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _todo, ctx) => {
      queryClient.setQueryData(TODOS_QUERY_KEY, ctx?.previous);
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(TODOS_QUERY_KEY, ctx?.previous);
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY }),
  });

  return { addMutation, updateMutation, deleteMutation };
}

export default useTodoMutations;
