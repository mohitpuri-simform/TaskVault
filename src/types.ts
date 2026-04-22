export type Filter = "all" | "active" | "completed";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  updatedAt: number;
  synced: boolean;
};

export type QueueAction =
  | { type: "create"; todo: Todo }
  | { type: "update"; todo: Todo }
  | { type: "delete"; id: string };
