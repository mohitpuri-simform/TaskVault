import type { Todo } from "../types";
import { axiosInstance } from "./http";

type ServerTodo = Omit<Todo, "synced">;

export async function getTodos() {
  const { data: todos } = await axiosInstance.get<ServerTodo[]>("/todos");
  return todos.map((todo) => ({ ...todo, synced: true }));
}

export async function createTodo(input: {
  title: string;
  completed: boolean;
  id?: string;
  updatedAt?: number;
  clientId?: string;
}) {
  const payload = {
    id:
      input.id ??
      `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    completed: input.completed,
    updatedAt: input.updatedAt ?? Date.now(),
    clientId: input.clientId,
  };

  const { data: created } = await axiosInstance.post<
    ServerTodo & { clientId?: string }
  >("/todos", payload);

  return {
    id: created.id,
    title: created.title,
    completed: created.completed,
    updatedAt: created.updatedAt,
    synced: true,
    clientId: created.clientId,
  };
}

export async function updateTodo(todo: Todo) {
  const { data: updated } = await axiosInstance.put<ServerTodo>(
    `/todos/${todo.id}`,
    {
      title: todo.title,
      completed: todo.completed,
    },
  );

  return { ...updated, synced: true };
}

export async function deleteTodo(id: string) {
  await axiosInstance.delete(`/todos/${id}`);
}
