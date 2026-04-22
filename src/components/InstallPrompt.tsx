import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  forceVisible?: boolean;
  highlighted?: boolean;
}

export function InstallPrompt({ forceVisible, highlighted }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const shouldRender = forceVisible || (showPrompt && deferredPrompt);
  const isPreview = Boolean(forceVisible && !deferredPrompt);

  if (!shouldRender) return null;

  return (
    <div
      className={`install-modal-overlay ${highlighted ? "install-modal-overlay-highlight" : ""} ${isPreview ? "install-modal-overlay-preview" : ""}`}
      onClick={handleDismiss}
    >
      <section
        className={`install-modal ${highlighted ? "feature-highlight" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-modal-header">
          <div className="install-modal-title-wrap">
            <Download className="install-modal-icon" />
            <div>
              <h3 id="install-modal-title" className="install-modal-title">
                Install App
              </h3>
              <p className="install-modal-description">
                {isPreview
                  ? "This is a highlight preview of the install prompt."
                  : "Add this app to your home screen for quick access."}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="install-modal-close"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
        <div className="install-modal-actions">
          <button
            onClick={handleInstall}
            className="install-modal-btn install-modal-btn-primary"
            disabled={isPreview}
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="install-modal-btn install-modal-btn-secondary"
          >
            Later
          </button>
        </div>
      </section>
    </div>
  );
}
