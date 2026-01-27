// Code protection utilities to prevent inspection

export const initCodeProtection = () => {
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
  if (import.meta.env.PROD) {
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp'];
    
    methods.forEach((method) => {
      (console as any)[method] = noop;
    });
  }

  // DevTools detection and response - ONLY in production
  if (import.meta.env.PROD) {
    let devtoolsOpen = false;
    
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          handleDevToolsOpen();
        }
      } else {
        devtoolsOpen = false;
      }
    };

    const handleDevToolsOpen = () => {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;font-family:sans-serif;"><h1>Access Denied</h1></div>';
    };

    // Check periodically
    setInterval(detectDevTools, 1000);

    // Debugger trap (makes debugging difficult)
    setInterval(() => {
      const before = new Date().getTime();
      debugger;
      const after = new Date().getTime();
      if (after - before > 100) {
        handleDevToolsOpen();
      }
    }, 1000);
  }

  // Prevent text selection (optional - can be annoying)
  document.addEventListener('selectstart', (e) => {
    if (import.meta.env.PROD) {
      e.preventDefault();
      return false;
    }
  });

  // Prevent drag
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });
};
