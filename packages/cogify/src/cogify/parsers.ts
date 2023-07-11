import { Type } from 'cmd-ts';
import { pathToFileURL } from 'node:url';

/**
 * Parse a input parameter as a URL,
 * if it looks like a file path convert it using `pathToFileURL`
 **/
export const Url: Type<string, URL> = {
  async from(str) {
    try {
      return new URL(str);
    } catch (e) {
      return pathToFileURL(str);
    }
  },
};
