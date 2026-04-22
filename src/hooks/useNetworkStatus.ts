import { useEffect, useState } from "react";

export type NetworkQuality = "good" | "avg" | "poor";

type NetworkConnectionInfo = {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function getConnectionInfo(): NetworkConnectionInfo | null {
  const nav = navigator as Navigator & {
    connection?: NetworkConnectionInfo;
    mozConnection?: NetworkConnectionInfo;
    webkitConnection?: NetworkConnectionInfo;
  };

  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function getNetworkQuality(isOnline: boolean): NetworkQuality {
  if (!isOnline) return "poor";

  const connection = getConnectionInfo();
  if (!connection) return "avg";

  const { effectiveType, downlink, rtt } = connection;

  if (effectiveType === "slow-2g" || effectiveType === "2g") return "poor";
  if (effectiveType === "3g") return "avg";

  if (typeof downlink === "number") {
    if (downlink < 1.5) return "poor";
    if (downlink < 5) return "avg";
  }

  if (typeof rtt === "number") {
    if (rtt > 450) return "poor";
    if (rtt > 180) return "avg";
  }

  return "good";
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(() =>
    getNetworkQuality(navigator.onLine),
  );

  useEffect(() => {
    const connection = getConnectionInfo();

    function updateNetworkState() {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      setNetworkQuality(getNetworkQuality(isOnline));
    }

    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    connection?.addEventListener?.("change", updateNetworkState);

    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
      connection?.removeEventListener?.("change", updateNetworkState);
    };
  }, []);

  return { online, networkQuality };
}
