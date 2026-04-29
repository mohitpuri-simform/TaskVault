import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import { AuthenticationGate } from "./components/AuthenticationGate";
import { INACTIVITY_LOCK_MS } from "./lib/constants";

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

function App() {
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    setIsSidebarOpen(false);
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
          activeItemId={activeFeatureId}
          onSelect={highlightFeature}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <section className="app-shell">
          <button
            type="button"
            className="sidebar-toggle-btn"
            aria-label="Toggle features sidebar"
            aria-controls="feature-sidebar-panel"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true" />
            <span>Features</span>
          </button>

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
            onSubmit={handleAddTodoFromHook}
            onSyncNow={() => void syncQueueNow()}
            isLoading={isLoading}
            isError={isError}
            todos={todos}
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
