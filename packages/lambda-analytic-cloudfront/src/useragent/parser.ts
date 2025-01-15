import UA from 'ua-parser-js';

import { UserAgentInfo, UserAgentOs, UserAgentParser } from './parser.types.js';

const OsMap: Record<string, UserAgentOs> = { ubuntu: 'linux' };
const UaParser: ParserConfig = { name: 'ua-parser-js', hit: 0 };
const Skipped: ParserConfig = { name: 'skipped', hit: 0 };
interface ParserConfig {
  name: string;
  hit: number;
  create?: UserAgentParser;
}
interface ParserCache {
  hit: number;
  parser: ParserConfig;
  value?: UserAgentInfo;
}

export class UserAgentParsers {
  parsers = new Map<string, ParserConfig[]>();
  cache = new Map<string, ParserCache>();

  addParser(value: string, create: UserAgentParser): void {
    const char = value[0].toLowerCase();
    const parser = this.parsers.get(char) ?? [];
    parser.push({ name: value.toLowerCase(), create, hit: 0 });
    this.parsers.set(char, parser);
  }

  parse(userAgent: string): UserAgentInfo | undefined {
    const existing = this.cache.get(userAgent);
    if (existing) {
      existing.hit++;
      existing.parser.hit++;
      return existing.value;
    }
    const ret = this._parse(userAgent);
    if (ret.value) {
      if (ret.value.version == null) ret.value.version = 'unknown';
      if (ret.value.variant == null) ret.value.variant = 'unknown';
      if (ret.value.os == null) ret.value.os = 'unknown';
    }
    ret.hit++;
    ret.parser.hit++;
    this.cache.set(userAgent, ret);
    return ret.value;
  }

  _parse(userAgent: string | undefined): ParserCache {
    if (userAgent == null || userAgent === '' || userAgent === '-' || userAgent === 'Mozilla/5.0') {
      return { value: { name: 'empty' }, parser: Skipped, hit: 0 };
    }
    const parsedName = decodeURI(userAgent);
    const lowered = parsedName.toLowerCase();

    // Is there a custom parser for the user agent string
    const parsers = this.parsers.get(lowered[0]) ?? [];
    for (const parser of parsers) {
      if (lowered.startsWith(parser.name)) return { value: parser.create?.(lowered), parser, hit: 0 };
    }

    // No custom parser attempt to pull the information from a generic user agent parser
    const ua = UA(userAgent);
    const output: Partial<UserAgentInfo> = {};

    if (ua.os.name) {
      output.os = ua.os.name.toLowerCase().replace(/ /g, '') as UserAgentOs;
      if (OsMap[output.os]) output.os = OsMap[output.os];
    }

    if (ua.browser.name) {
      output.name = ua.browser.name.replace(/ /g, '').toLowerCase();
      if (ua.browser.version) output.version = ua.browser.version.slice(0, ua.browser.version.indexOf('.'));
      return { value: output as UserAgentInfo, parser: UaParser, hit: 0 };
    }

    if (ua.os.name === 'Android') {
      const slashIndex = parsedName.indexOf('/');
      if (slashIndex > -1) {
        output.name = 'android';
        output.variant = lowered.slice(0, slashIndex);
        return { value: output as UserAgentInfo, parser: UaParser, hit: 0 };
      }
    }
    // IOS apps
    // Tracks%2520NZ/1 CFNetwork/1335.0.3 Darwin/21.6.0'
    // com.spatialnetworks.fulcrum/4.0.1%20iPhone/16.4.1%20hw/iPhone13_2
    if (
      ua.os.name === 'iOS' ||
      lowered.includes('iphone/') ||
      lowered.includes('ios/') ||
      lowered.includes('ipad/') ||
      lowered.includes('ios simulator/')
    ) {
      const slashIndex = parsedName.indexOf('/');
      if (slashIndex > -1) {
        output.os = output.os ?? 'ios';
        output.name = 'ios';
        output.variant = decodeURIComponent(lowered.slice(0, slashIndex)).replace(/ /g, '');
        return { value: output as UserAgentInfo, parser: UaParser, hit: 0 };
      }
    }

    return { value: { name: 'unknown' }, parser: Skipped, hit: 0 };
  }
}
