export type UserAgentParser = (ua: string) => UserAgentInfo | undefined;
export interface UserAgentInfo {
  name: string;
  variant?: string;
  version?: string;
  os?: UserAgentOs;
}

export type UserAgentOs = 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'unknown';
export const ValidOs = new Set(['windows', 'macos', 'ios', 'android', 'linux']);

export function isValidOs(os: string): os is UserAgentOs {
  return ValidOs.has(os);
}
