import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useTodos, { TODOS_QUERY_KEY } from "./useTodos";
import useTodoMutations from "./useTodoMutations";
import useQueueSync from "./useQueueSync";
import { useNetworkStatus } from "./useNetworkStatus";
import type { Todo } from "../types";

interface UseTodoCrudOptions {
  onNotification?: (message: string) => void;
}

export function useTodoCrud(options: UseTodoCrudOptions = {}) {
  const { onNotification } = options;
  const queryClient = useQueryClient();
  const { data: todos = [], isLoading, isError } = useTodos();
  const { addMutation, updateMutation, deleteMutation } =
    useTodoMutations(onNotification);
  const { online } = useNetworkStatus();
  const { queue, setQueue, enqueue, syncQueueNow, syncing } =
    useQueueSync(online);

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[type="text"]');
    if (!input) return;

    const title = input.value.trim();
    if (!title) return;
    input.value = "";

    if (online) {
      addMutation.mutate(title);
      return;
    }

    // Offline: store optimistically in the query cache and queue for later.
    const optimisticTodo: Todo = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      updatedAt: Date.now(),
      synced: false,
    };
    queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) => [
      optimisticTodo,
      ...old,
    ]);
    enqueue({ type: "create", todo: optimisticTodo });
    onNotification?.(`Saved offline: ${title}`);
  }

  function handlePatchTodo(todo: Todo, changes: Partial<Todo>) {
    const updated: Todo = {
      ...todo,
      ...changes,
      updatedAt: Date.now(),
      synced: online,
    };

    if (todo.id.startsWith("local-")) {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((t) => (t.id === todo.id ? updated : t)),
      );
      setQueue((prev) =>
        prev.map((a) =>
          a.type === "create" && a.todo.id === todo.id
            ? { ...a, todo: updated }
            : a,
        ),
      );
      return;
    }

    if (online) {
      updateMutation.mutate(updated);
    } else {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((t) => (t.id === todo.id ? { ...updated, synced: false } : t)),
      );
      enqueue({ type: "update", todo: { ...updated, synced: false } });
    }
  }

  function handleDeleteTodo(todo: Todo) {
    if (todo.id.startsWith("local-")) {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.filter((t) => t.id !== todo.id),
      );
      setQueue((prev) =>
        prev.filter((a) => !(a.type === "create" && a.todo.id === todo.id)),
      );
      return;
    }

    if (online) {
      deleteMutation.mutate(todo.id);
    } else {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.filter((t) => t.id !== todo.id),
      );
      enqueue({ type: "delete", id: todo.id });
    }
  }

  return {
    todos,
    isLoading,
    isError,
    online,
    syncing,
    queueLength: queue.length,
    handleAddTodo,
    handlePatchTodo,
    handleDeleteTodo,
    syncQueueNow,
  };
}
