import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useTodoCrud } from "./hooks/useTodoCrud";
import { useWebAuthn } from "./hooks/useWebAuthn";
import { InstallPrompt } from "./components/InstallPrompt";
import { WebcamPanel } from "./components/WebcamPanel";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { FeatureSidebar } from "./components/FeatureSidebar";
import { ProfilePage } from "./components/ProfilePage";
import { TopBar } from "./components/TopBar";
import { TodoPanel } from "./components/TodoPanel";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import type { Filter } from "./types";
import { AuthenticationGate } from "./components/AuthenticationGate";

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
  const INACTIVITY_LOCK_MS = 60_000;
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);
  const initializedLockRef = useRef(false);
  const { networkQuality } = useNetworkStatus();
  const { credentialId } = useWebAuthn();
  const {
    todos,
    isLoading,
    isError,
    online,
    syncing,
    queueLength,
    handleAddTodo: handleAddTodoFromHook,
    handlePatchTodo,
    handleDeleteTodo,
    syncQueueNow,
  } = useTodoCrud({ onNotification: showLocalNotification });

  function highlightFeature(item: { id: string; targetId: string }) {
    setActiveFeatureId(null);
    requestAnimationFrame(() => {
      setActiveFeatureId(item.id);
      const target = document.getElementById(item.targetId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function handleOpenProfile() {
    if (isAppLocked) {
      return;
    }

    // If a credential is registered, show auth gate first
    if (credentialId) {
      setShowAuthGate(true);
    } else {
      // Otherwise open profile directly
      setShowProfile(true);
    }
  }

  useEffect(() => {
    if (!initializedLockRef.current) {
      setIsAppLocked(Boolean(credentialId));
      initializedLockRef.current = true;
      return;
    }

    if (!credentialId) {
      setIsAppLocked(false);
      setShowAuthGate(false);
      setShowProfile(false);
    }
  }, [credentialId]);

  useEffect(() => {
    if (!credentialId) {
      hiddenAtRef.current = null;
      return;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (
        hiddenAtRef.current !== null &&
        Date.now() - hiddenAtRef.current >= INACTIVITY_LOCK_MS
      ) {
        setIsAppLocked(true);
        setShowAuthGate(false);
        setShowProfile(false);
      }

      hiddenAtRef.current = null;
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [credentialId]);

  useEffect(() => {
    if (!activeFeatureId) return;

    const timeoutId = window.setTimeout(() => {
      setActiveFeatureId(null);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [activeFeatureId]);

  useEffect(() => {
    if (online) void syncQueueNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    setDraft("");
    handleAddTodoFromHook(event);
  }

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [filter, todos]);

  return (
    <>
      {isAppLocked ? (
        <AuthenticationGate
          title="Unlock App"
          message="Use your registered WebAuthn credential to unlock the app."
          allowCancel={false}
          onAuthSuccess={() => setIsAppLocked(false)}
        />
      ) : null}
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
            queueLength={queueLength}
            onEnableNotifications={askNotificationPermission}
            onOpenProfile={handleOpenProfile}
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
      {showAuthGate && (
        <AuthenticationGate
          onAuthSuccess={() => {
            setShowAuthGate(false);
            setShowProfile(true);
          }}
          onCancel={() => setShowAuthGate(false)}
        />
      )}
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default App;
