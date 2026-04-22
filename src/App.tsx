import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import useTodos, { TODOS_QUERY_KEY } from "./hooks/useTodos";
import useTodoMutations from "./hooks/useTodoMutations";
import useQueueSync from "./hooks/useQueueSync";
import { useQueryClient } from "@tanstack/react-query";
import { InstallPrompt } from "./components/InstallPrompt";
import { WebcamPanel } from "./components/WebcamPanel";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { FeatureSidebar } from "./components/FeatureSidebar";
import { ProfilePage } from "./components/ProfilePage";
import { TopBar } from "./components/TopBar";
import { TodoPanel } from "./components/TodoPanel";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import type { Filter, Todo } from "./types";

const TodoStats = lazy(() =>
  import("./components/TodoStats").then((module) => ({
    default: module.TodoStats,
  })),
);

function askNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function showLocalNotification(message: string) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Todo Update", {
      body: message,
    });
  }
}

const FEATURE_ITEMS = [
  {
    id: "install-pwa",
    name: "Install PWA",
    description: "Install prompt modal for adding this web app to your device.",
    targetId: "feature-install",
  },
  {
    id: "network-quality",
    name: "Adaptive Network Quality",
    description:
      "Live Net Good/Avg/Poor quality badge from connection signals.",
    targetId: "feature-network",
  },
  {
    id: "profile-avatar",
    name: "Webcam + Capture Profile Photo",
    description:
      "Tap avatar to open webcam modal and store captured profile photo.",
    targetId: "feature-profile",
  },
  {
    id: "offline-sync",
    name: "Offline-First Sync Queue",
    description: "Queues CRUD actions offline and syncs back when online.",
    targetId: "feature-sync",
  },
  {
    id: "todo-stats",
    name: "Cached Todo Stats",
    description: "Summary panel backed by local cache and background refetch.",
    targetId: "feature-stats",
  },
  {
    id: "webcam-pip",
    name: "Webcam Picture-in-Picture",
    description: "Start webcam and pop it out into Picture-in-Picture mode.",
    targetId: "feature-webcam",
  },
] as const;

function App() {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const { online, networkQuality } = useNetworkStatus();

  function highlightFeature(item: { id: string; targetId: string }) {
    setActiveFeatureId(null);
    requestAnimationFrame(() => {
      setActiveFeatureId(item.id);
      const target = document.getElementById(item.targetId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  useEffect(() => {
    if (!activeFeatureId) return;

    const timeoutId = window.setTimeout(() => {
      setActiveFeatureId(null);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [activeFeatureId]);

  // Data + mutations provided by hooks.
  const queryClient = useQueryClient();
  const { data: todos = [], isLoading, isError } = useTodos();
  const { addMutation, updateMutation, deleteMutation } = useTodoMutations(
    showLocalNotification,
  );
  const { queue, setQueue, enqueue, syncQueueNow, syncing } =
    useQueueSync(online);

  useEffect(() => {
    if (online) void syncQueueNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setDraft("");

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
    showLocalNotification(`Saved offline: ${title}`);
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

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [filter, todos]);

  return (
    <>
      <main className="app-layout">
        <FeatureSidebar
          items={[...FEATURE_ITEMS]}
          activeItemId={activeFeatureId}
          onSelect={highlightFeature}
        />

        <section className="app-shell">
          <TopBar
            highlighted={activeFeatureId === "network-quality"}
            online={online}
            networkQuality={networkQuality}
            syncing={syncing}
            queueLength={queue.length}
            onEnableNotifications={askNotificationPermission}
            onOpenProfile={() => setShowProfile(true)}
          />

          <div
            id="feature-profile"
            className={
              activeFeatureId === "profile-avatar" ? "feature-highlight" : ""
            }
          >
            <ProfileAvatar />
          </div>

          <TodoPanel
            highlighted={activeFeatureId === "offline-sync"}
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleAddTodo}
            filter={filter}
            onFilterChange={setFilter}
            onSyncNow={() => void syncQueueNow()}
            isLoading={isLoading}
            isError={isError}
            todos={filteredTodos}
            onToggle={(todo, nextCompleted) => {
              if (nextCompleted && !todo.completed) {
                showLocalNotification(`Completed: ${todo.title}`);
              }
              handlePatchTodo(todo, { completed: nextCompleted });
            }}
            onTitleChange={(todo, title) => handlePatchTodo(todo, { title })}
            onDelete={handleDeleteTodo}
          />

          <div
            id="feature-stats"
            className={
              activeFeatureId === "todo-stats" ? "feature-highlight" : ""
            }
          >
            <Suspense
              fallback={
                <section className="card muted">Loading stats...</section>
              }
            >
              <TodoStats todos={todos} />
            </Suspense>
          </div>

          <div
            id="feature-webcam"
            className={
              activeFeatureId === "webcam-pip" ? "feature-highlight" : ""
            }
          >
            <WebcamPanel />
          </div>

          <div id="feature-install">
            <InstallPrompt
              forceVisible={activeFeatureId === "install-pwa"}
              highlighted={activeFeatureId === "install-pwa"}
            />
          </div>
        </section>
      </main>
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default App;
