import { fsa } from '@basemaps/shared';
import { Type } from 'cmd-ts';
import { pathToFileURL } from 'node:url';

/**
 * Parse a input parameter as a URL.
 *
 * If it looks like a file path, it will be converted using `pathToFileURL`.
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

/**
 * Parse a input parameter as a URL which represents a folder.
 *
 * If it looks like a file path, it will be converted using `pathToFileURL`.
 * Any search parameters or hash will be removed, and a trailing slash added
 * to the path section if it's not present.
 **/
export const UrlFolder: Type<string, URL> = {
  async from(str) {
    const url = await Url.from(str);
    url.search = '';
    url.hash = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  },
};

/**
 * Parse a JSON file containing an array of URLs.
 *
 * JSON file must contain an outer array, inside of which is a series of objects
 * with key "path", the value of which will be parsed as a URL. If the looks
 * like a file path, it will instead be converted using `pathToFileURL`.
 **/
export const UrlArrayJsonFile: Type<string, URL[]> = {
  async from(str) {
    const raw: { path: string }[] = await fsa.readJson(str);
    if (!Array.isArray(raw)) throw new Error('JSON does not contain an outer array');
    const urls = raw.map((f) => {
      if (!('path' in f)) throw new Error('Missing key "path"');
      try {
        return new URL(f.path);
      } catch (e) {
        return pathToFileURL(f.path);
      }
    });
    return urls;
  },
};
