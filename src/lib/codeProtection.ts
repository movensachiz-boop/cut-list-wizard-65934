// Code protection utilities to prevent inspection

export const initCodeProtection = () => {
  // Skip ALL protection in development mode
  if (!import.meta.env.PROD) {
    return;
  }

  // NOTE:
  // DevTools detection is inherently unreliable across browsers/OSes.
  // We keep a conservative signal (window size deltas) and show a reversible
  // overlay instead of permanently wiping the DOM.
  const DEVTOOLS_SIZE_THRESHOLD_PX = 160;
  const DEVTOOLS_CONFIRM_TICKS = 2; // require consecutive detections
  const DEVTOOLS_BLOCKER_ID = "__devtools_blocker";

  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for DevTools
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+C (Element selector)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (View source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+S (Save page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });

  // Disable console methods in production
  const noop = () => {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp'];
  
  methods.forEach((method) => {
    (console as any)[method] = noop;
  });

  // DevTools detection and response
  let consecutiveDevtoolsTicks = 0;

  const isDevToolsLikelyOpen = () => {
    // Some environments can report 0 for outerWidth/outerHeight.
    if (!window.outerWidth || !window.outerHeight) return false;
    const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
    const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
    return (
      widthDiff > DEVTOOLS_SIZE_THRESHOLD_PX ||
      heightDiff > DEVTOOLS_SIZE_THRESHOLD_PX
    );
  };

  const showDevToolsBlocker = () => {
    if (document.getElementById(DEVTOOLS_BLOCKER_ID)) return;

    const blocker = document.createElement("div");
    blocker.id = DEVTOOLS_BLOCKER_ID;
    blocker.setAttribute("role", "alert");
    blocker.style.position = "fixed";
    blocker.style.inset = "0";
    blocker.style.zIndex = "2147483647";
    blocker.style.display = "flex";
    blocker.style.alignItems = "center";
    blocker.style.justifyContent = "center";
    blocker.style.background = "#111";
    blocker.style.color = "#fff";
    blocker.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    blocker.style.padding = "24px";
    blocker.innerHTML = "<h1 style=\"margin:0;font-size:32px;line-height:1.1;\">Access Denied</h1>";

    // Append after body exists
    if (document.body) document.body.appendChild(blocker);
  };

  const hideDevToolsBlocker = () => {
    const blocker = document.getElementById(DEVTOOLS_BLOCKER_ID);
    if (blocker) blocker.remove();
  };

  // Conservative check: require consecutive detections while tab is visible.
  setInterval(() => {
    if (document.visibilityState !== "visible") return;

    if (isDevToolsLikelyOpen()) {
      consecutiveDevtoolsTicks += 1;
    } else {
      consecutiveDevtoolsTicks = 0;
      hideDevToolsBlocker();
    }

    if (consecutiveDevtoolsTicks >= DEVTOOLS_CONFIRM_TICKS) {
      showDevToolsBlocker();
    }
  }, 1000);

  // Prevent text selection
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Prevent drag
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });
};
