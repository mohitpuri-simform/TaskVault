import { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  PictureInPicture,
  PictureInPicture2,
} from "lucide-react";

type Status = "idle" | "active" | "error";

interface WebcamPanelProps {
  onCapture?: (dataUrl: string) => void;
  showCaptureButton?: boolean;
}

export function WebcamPanel({
  onCapture,
  showCaptureButton,
}: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPiP, setIsPiP] = useState(false);

  // Keep isPiP in sync when the user exits PiP from the browser UI
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  // Release media tracks when the component unmounts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("active");
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Allow access and try again."
          : "Could not open camera. Make sure one is connected.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setIsPiP(false);
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      setErrorMsg("Picture‑in‑Picture is not supported by your browser.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    onCapture?.(dataUrl);
  }, [onCapture]);

  const pipSupported =
    typeof document !== "undefined" &&
    "pictureInPictureEnabled" in document &&
    document.pictureInPictureEnabled;

  return (
    <section className="card webcam-panel" aria-label="Webcam">
      <div className="webcam-header">
        <h2 className="webcam-title">
          <Camera size={18} aria-hidden="true" />
          Webcam
        </h2>

        <div className="webcam-controls">
          {status === "active" ? (
            <>
              {pipSupported && (
                <button
                  type="button"
                  className={`webcam-btn${isPiP ? " webcam-btn-pip-active" : ""}`}
                  onClick={() => void togglePiP()}
                  title={
                    isPiP ? "Exit Picture‑in‑Picture" : "Picture‑in‑Picture"
                  }
                  aria-label={
                    isPiP
                      ? "Exit Picture‑in‑Picture"
                      : "Enter Picture‑in‑Picture"
                  }
                >
                  {isPiP ? (
                    <PictureInPicture2 size={16} />
                  ) : (
                    <PictureInPicture size={16} />
                  )}
                  {isPiP ? "Exit PiP" : "Picture‑in‑Picture"}
                </button>
              )}
              <button
                type="button"
                className="webcam-btn webcam-btn-stop"
                onClick={stopCamera}
                aria-label="Stop camera"
              >
                <CameraOff size={16} />
                Stop
              </button>
              {showCaptureButton && (
                <button
                  type="button"
                  className="webcam-btn webcam-btn-capture"
                  onClick={capturePhoto}
                  aria-label="Capture photo"
                  title="Capture photo"
                >
                  <Camera size={16} />
                  Capture
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="webcam-btn webcam-btn-start"
              onClick={() => void startCamera()}
              aria-label="Start camera"
            >
              <Camera size={16} />
              Start Camera
            </button>
          )}
        </div>
      </div>

      <div
        className={`webcam-viewport${
          status === "idle" ? " webcam-viewport-idle" : ""
        }`}
      >
        {/* Always mounted so the ref stays stable for the PiP API */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`webcam-video${
            status !== "active" ? " webcam-video-hidden" : ""
          }`}
          aria-label="Webcam feed"
        />

        {status === "idle" && (
          <div className="webcam-placeholder">
            <Camera size={40} className="webcam-placeholder-icon" />
            <p>Camera is off</p>
          </div>
        )}

        {status === "error" && (
          <div className="webcam-error-state">
            <CameraOff size={32} />
            <p>{errorMsg}</p>
            <button
              type="button"
              className="webcam-btn webcam-btn-start"
              onClick={() => void startCamera()}
            >
              Try again
            </button>
          </div>
        )}

        {isPiP && status === "active" && (
          <div className="webcam-pip-badge">
            <PictureInPicture2 size={14} />
            Playing in Picture‑in‑Picture
          </div>
        )}
      </div>
    </section>
  );
}
