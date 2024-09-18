// Import browser-compatible polyfills
import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';
import stream from 'stream-browserify';

// Set global to window in browser
if (typeof global === 'undefined') {
  window.global = window;
}

// Polyfill Buffer for the browser
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

// Polyfill crypto for the browser
if (typeof window.crypto === 'undefined') {
  window.crypto = crypto;
}
global.stream = stream;
