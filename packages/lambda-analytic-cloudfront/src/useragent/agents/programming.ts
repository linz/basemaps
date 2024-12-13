import { UserAgentParser } from '../parser.types.js';

// Programming languages internal http clients
export const Programming: Record<string, UserAgentParser> = {
  'python-requests/': (ua) => ({ name: 'python', variant: 'requests', version: ua.slice('python-requests/'.length) }),
  'python-urllib/': (ua) => ({ name: 'python', variant: 'urllib', version: ua.slice('python-urllib/'.length) }),
  'python/': (ua) => ({ name: 'python', version: ua.slice('python/'.length, ua.lastIndexOf('.')) }),
  'java/': (ua) => ({ name: 'java', version: ua.slice('java/'.length, ua.lastIndexOf('.')) }),
  'axios/': (ua) => ({ name: 'axios', version: ua.slice('axios/'.length, ua.lastIndexOf('.')).replace('/', '_') }),
  'okhttp/': (ua) => ({ name: 'okhttp', version: ua.slice('okhttp/'.length, ua.lastIndexOf('.')).replace('/', '_') }),
  'Go-http-client/': (ua) => ({ name: 'go', variant: 'http', version: ua.slice('Go-http-client/'.length) }),
  'Dart/': (ua) => ({ name: 'dart', version: ua.split(' ')[0].slice('Dart/'.length) }),
  'Apache-HttpClient/': (ua) => ({
    name: 'apache',
    variant: 'http',
    version: ua.slice('Apache-HttpClient/'.length, ua.lastIndexOf('.')),
  }),
  flutter_: () => ({ name: 'flutter' }),
};

// Bots
export const Bot: Record<string, UserAgentParser> = {
  'Googlebot-Image/': (ua) => ({ name: 'bot', variant: 'google', version: ua.split('/').at(1) }),
  'AdsBot-Google': () => ({ name: 'bot', variant: 'google' }),
};
