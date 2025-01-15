import { Gis } from './agents/gis.js';
import { Bot, Programming } from './agents/programming.js';
import { UserAgentParsers } from './parser.js';

export const UaParser = new UserAgentParsers();

Object.entries(Programming).forEach(([key, create]) => UaParser.addParser(key, create));
Object.entries(Gis).forEach(([key, create]) => UaParser.addParser(key, create));
Object.entries(Bot).forEach(([key, create]) => UaParser.addParser(key, create));
