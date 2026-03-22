import React, { LazyExoticComponent, FC } from 'react';
import {
    Code, FileCode, Clock, Table,
    Binary, Fingerprint, Link, ShieldCheck, Type,
    Pilcrow, Palette, Key, Hash
} from 'lucide-react';

export interface ToolDefinition {
    id: string;
    name: string;
    icon: React.ElementType;
    description: string;
    component: LazyExoticComponent<FC<any>>;
}

export const toolRegistry: ToolDefinition[] = [
    {
        id: 'json',
        name: 'JSON Formatter',
        icon: Code,
        description: 'Prettify and validate JSON structures',
        component: React.lazy(() => import('../components/tools/JsonFormatter').then(module => ({ default: module.JsonTool })))
    },
    {
        id: 'diff',
        name: 'Text Diff',
        icon: FileCode,
        description: 'Compare two text blocks side-by-side',
        component: React.lazy(() => import('../components/tools/TextDiff').then(module => ({ default: module.DiffTool })))
    },
    {
        id: 'time',
        name: 'Time Converter',
        icon: Clock,
        description: 'Unix Epoch to ISO & Local conversions',
        component: React.lazy(() => import('../components/tools/TimeConverter').then(module => ({ default: module.TimeTool })))
    },
    {
        id: 'csv',
        name: 'CSV Transformer',
        icon: Table,
        description: 'Convert CSV to JSON or Table view',
        component: React.lazy(() => import('../components/tools/CsvTransformer').then(module => ({ default: module.CsvTool })))
    },
    {
        id: 'base64',
        name: 'Base64 Encoder',
        icon: Binary,
        description: 'Convert strings/images to & from Base64',
        component: React.lazy(() => import('../components/tools/Base64').then(module => ({ default: module.Base64Tool })))
    },
    {
        id: 'uuid',
        name: 'UUID Generator',
        icon: Fingerprint,
        description: 'Generate unique IDs for testing',
        component: React.lazy(() => import('../components/tools/UuidGenerator').then(module => ({ default: module.UuidTool })))
    },
    {
        id: 'url',
        name: 'URL Encoder',
        icon: Link,
        description: 'Sanitize & decode URL parameters',
        component: React.lazy(() => import('../components/tools/UrlEncoder').then(module => ({ default: module.UrlTool })))
    },
    {
        id: 'jwt',
        name: 'JWT Debugger',
        icon: ShieldCheck,
        description: 'Inspect JSON Web Token payloads',
        component: React.lazy(() => import('../components/tools/JwtDebugger').then(module => ({ default: module.JwtTool })))
    },
    {
        id: 'textcase',
        name: 'Case Converter',
        icon: Type,
        description: 'Switch between camel, snake, kebab case',
        component: React.lazy(() => import('../components/tools/CaseConverter').then(module => ({ default: module.TextCaseTool })))
    },
    {
        id: 'lorem',
        name: 'Lorem Ipsum',
        icon: Pilcrow,
        description: 'Generate placeholder text',
        component: React.lazy(() => import('../components/tools/LoremIpsum').then(module => ({ default: module.LoremTool })))
    },
    {
        id: 'color',
        name: 'Color Picker',
        icon: Palette,
        description: 'Convert HEX, RGB, HSL values',
        component: React.lazy(() => import('../components/tools/ColorPicker').then(module => ({ default: module.ColorTool })))
    },
    {
        id: 'password',
        name: 'Password Gen',
        icon: Key,
        description: 'Secure random string generator',
        component: React.lazy(() => import('../components/tools/PasswordGenerator').then(module => ({ default: module.PasswordTool })))
    },
    {
        id: 'hash',
        name: 'Hash Generator',
        icon: Hash,
        description: 'Compute MD5, SHA-1, SHA-256',
        component: React.lazy(() => import('../components/tools/HashGenerator').then(module => ({ default: module.HashTool })))
    },
    {
        id: 'qr',
        name: 'QR Code',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.QrCode }))),
        description: 'Generate SVG/PNG QR Codes',
        component: React.lazy(() => import('../components/tools/QRCode').then(module => ({ default: module.QRCodeTool })))
    },
    {
        id: 'pdf',
        name: 'PDF Manager',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.FileText }))),
        description: 'Merge and split PDF files',
        component: React.lazy(() => import('../components/tools/PdfManager').then(module => ({ default: module.PdfManager })))
    },
    {
        id: 'profile',
        name: 'Profile Cropper',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.UserCircle }))),
        description: 'Create circular profile pics',
        component: React.lazy(() => import('../components/tools/ProfileMaker').then(module => ({ default: module.ProfileMaker })))
    },
    {
        id: 'textcleaner',
        name: 'Text Cleaner',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.Eraser }))),
        description: 'Strip HTML & format text',
        component: React.lazy(() => import('../components/tools/TextCleaner').then(module => ({ default: module.TextCleaner })))
    },
    {
        id: 'exif',
        name: 'EXIF Viewer',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.Camera }))),
        description: 'View image metadata',
        component: React.lazy(() => import('../components/tools/ExifViewer').then(module => ({ default: module.ExifViewer })))
    },
    {
        id: 'meme',
        name: 'Meme Maker',
        icon: React.lazy(() => import('lucide-react').then(m => ({ default: m.Image }))),
        description: 'Add captions to images',
        component: React.lazy(() => import('../components/tools/MemeMaker').then(module => ({ default: module.MemeMaker })))
    },
];
