import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueueAction } from "../types";
import { loadQueue, saveQueue } from "../lib/storage";
import {
  createTodo as apiCreate,
  updateTodo as apiUpdate,
  deleteTodo as apiDelete,
} from "../lib/api";
import { TODOS_QUERY_KEY } from "./useTodos";

export function useQueueSync(online: boolean) {
  const [queue, setQueue] = useState<QueueAction[]>(() => loadQueue());
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const enqueue = (action: QueueAction) => {
    setQueue((prev) => [...prev, action]);
  };

  async function syncQueueNow(sourceQueue = queue) {
    if (!online || sourceQueue.length === 0) return;
    setSyncing(true);
    const remaining: QueueAction[] = [];

    for (const action of sourceQueue) {
      try {
        if (action.type === "create") {
          await apiCreate({
            id: action.todo.id,
            title: action.todo.title,
            completed: action.todo.completed,
            updatedAt: action.todo.updatedAt,
            clientId: action.todo.id,
          });
        } else if (action.type === "update") {
          await apiUpdate({ ...action.todo, synced: true });
        } else {
          await apiDelete(action.id);
        }
      } catch {
        remaining.push(action);
      }
    }

    setQueue(remaining);
    await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    setSyncing(false);
  }

  return { queue, setQueue, enqueue, syncQueueNow, syncing } as const;
}

export default useQueueSync;
