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
  // Edge can report larger outer/inner deltas than Chrome (borders/UI scaling),
  // so we use higher thresholds + a longer confirm window to reduce false positives.
  const IS_EDGE = /Edg\//.test(navigator.userAgent);
  const DEVTOOLS_SIZE_THRESHOLD_PX = IS_EDGE ? 360 : 260;
  const DEVTOOLS_EXTREME_THRESHOLD_PX = IS_EDGE ? 520 : 460;
  const DEVTOOLS_CONFIRM_TICKS = 3; // require consecutive detections
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

  // DevTools detection disabled: it caused false "Access Denied" lockouts
  // on legitimate devices (browser zoom, split screens, Edge chrome sizing).
  const existingBlocker = document.getElementById("__devtools_blocker");
  if (existingBlocker) existingBlocker.remove();


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
