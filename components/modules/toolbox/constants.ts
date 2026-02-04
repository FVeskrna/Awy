import {
    Code, FileCode, Clock, Table,
    Binary, Fingerprint, Link, ShieldCheck, Type,
    Pilcrow, Palette, Key, Hash
} from 'lucide-react';
import { Tool } from './types';

export const TOOLS: Tool[] = [
    { id: 'json', name: 'JSON Formatter', icon: Code, description: 'Prettify and validate JSON structures' },
    { id: 'diff', name: 'Text Diff', icon: FileCode, description: 'Compare two text blocks side-by-side' },
    { id: 'time', name: 'Time Converter', icon: Clock, description: 'Unix Epoch to ISO & Local conversions' },
    { id: 'csv', name: 'CSV Transformer', icon: Table, description: 'Convert CSV to JSON or Table view' },
    { id: 'base64', name: 'Base64 Encoder', icon: Binary, description: 'Convert strings/images to & from Base64' },
    { id: 'uuid', name: 'UUID Generator', icon: Fingerprint, description: 'Generate unique IDs for testing' },
    { id: 'url', name: 'URL Encoder', icon: Link, description: 'Sanitize & decode URL parameters' },
    { id: 'jwt', name: 'JWT Debugger', icon: ShieldCheck, description: 'Inspect JSON Web Token payloads' },
    { id: 'textcase', name: 'Case Converter', icon: Type, description: 'Switch between camel, snake, kebab case' },
    { id: 'lorem', name: 'Lorem Ipsum', icon: Pilcrow, description: 'Generate placeholder text' },
    { id: 'color', name: 'Color Picker', icon: Palette, description: 'Convert HEX, RGB, HSL values' },
    { id: 'password', name: 'Password Gen', icon: Key, description: 'Secure random string generator' },
    { id: 'hash', name: 'Hash Generator', icon: Hash, description: 'Compute MD5, SHA-1, SHA-256' },
];
