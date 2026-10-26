import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function hmrIframeShimPlugin(): Plugin {
  const shimScript = `
    (function() {
      window.addEventListener('error', function(e) {
        var msg = (e && (e.message || (e.error && e.error.message))) || '';
        var file = (e && e.filename) || '';
        if (msg.indexOf('WebSocket') !== -1 || msg.indexOf('createWebSocketModuleRunnerTransport') !== -1 || file.indexOf('@vite/client') !== -1) {
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (e.preventDefault) e.preventDefault();
          return true;
        }
      }, true);
      window.addEventListener('unhandledrejection', function(e) {
        var reason = (e && e.reason) || '';
        var str = String(reason.message || reason);
        if (str.indexOf('WebSocket') !== -1 || str.indexOf('@vite/client') !== -1) {
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (e.preventDefault) e.preventDefault();
          return true;
        }
      }, true);
      var OrigWebSocket = window.WebSocket;
      if (!OrigWebSocket) return;
      window.WebSocket = function(url, protocols) {
        var urlStr = String(url || '');
        if (urlStr.indexOf('vite') !== -1 || urlStr.indexOf('ais-dev') !== -1 || urlStr.indexOf('run.app') !== -1 || urlStr.indexOf('localhost') !== -1) {
          var listeners = {};
          var fakeWs = {
            readyState: 3,
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3,
            url: urlStr,
            protocol: '',
            extensions: '',
            bufferedAmount: 0,
            binaryType: 'blob',
            send: function() {},
            close: function() {},
            addEventListener: function(type, fn) {
              listeners[type] = listeners[type] || [];
              listeners[type].push(fn);
            },
            removeEventListener: function(type, fn) {
              if (!listeners[type]) return;
              listeners[type] = listeners[type].filter(function(cb) { return cb !== fn; });
            },
            dispatchEvent: function() { return true; },
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null
          };
          setTimeout(function() {
            var closeEvt = { code: 1000, reason: 'HMR disabled in AI Studio iframe', wasClean: true };
            if (typeof fakeWs.onclose === 'function') {
              try { fakeWs.onclose(closeEvt); } catch(err) {}
            }
            if (listeners['close']) {
              listeners['close'].forEach(function(cb) {
                try { cb(closeEvt); } catch(err) {}
              });
            }
          }, 5);
          return fakeWs;
        }
        return new OrigWebSocket(url, protocols);
      };
      window.WebSocket.prototype = OrigWebSocket.prototype;
      window.WebSocket.CONNECTING = 0;
      window.WebSocket.OPEN = 1;
      window.WebSocket.CLOSING = 2;
      window.WebSocket.CLOSED = 3;
    })();
  `;

  return {
    name: 'vite-plugin-hmr-iframe-shim',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            children: shimScript,
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [hmrIframeShimPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket errors in the iframe environment.
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
