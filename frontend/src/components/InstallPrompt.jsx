import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISSED_KEY = "extracker-install-prompt-dismissed";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
  !window.MSStream;

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    const recentlyDismissed = dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
    if (recentlyDismissed) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIos()) {
      setIosDevice(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandalone()) return undefined;
    const handleInstallRequest = async () => {
      if (!deferredPrompt) {
        setShowPrompt(true);
        return;
      }
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("extracker:install", handleInstallRequest);
    return () => window.removeEventListener("extracker:install", handleInstallRequest);
  }, [deferredPrompt]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <aside className="install-prompt" role="dialog" aria-label="Install ExTracker">
      <div className="install-prompt-icon"><Download size={20} /></div>
      <div className="install-prompt-content">
        <strong>Install ExTracker</strong>
        {iosDevice ? (
          <span>Tap <Share size={14} /> then “Add to Home Screen”.</span>
        ) : deferredPrompt ? (
          <span>Use ExTracker like an app from your home screen.</span>
        ) : (
          <span>Open your browser menu and choose “Install app” or “Add to Home screen”.</span>
        )}
      </div>
      {!iosDevice && deferredPrompt && (
        <button type="button" className="install-prompt-action" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="Dismiss install prompt">
        <X size={18} />
      </button>
    </aside>
  );
};

export default InstallPrompt;
