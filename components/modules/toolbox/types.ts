import React from 'react';

export type ToolId = 'json' | 'diff' | 'time' | 'csv' | 'base64' | 'uuid' | 'url' | 'jwt' | 'textcase' | 'lorem' | 'color' | 'password' | 'hash';

export interface Tool {
    id: ToolId;
    name: string;
    icon: React.ElementType;
    description: string;
}
