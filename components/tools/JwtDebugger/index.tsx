import React, { useMemo } from 'react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const JwtTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'jwt')!;
    const [jwt, setJwt] = usePersistentState('jwt_input', '');

    const decoded = useMemo(() => {
        if (!jwt) return null;
        try {
            const parts = jwt.split('.');
            if (parts.length !== 3) throw new Error('Invalid JWT format');

            const decodePart = (part: string) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));

            return {
                header: decodePart(parts[0]),
                payload: decodePart(parts[1]),
                signature: parts[2]
            };
        } catch (e) {
            return { error: 'Invalid JWT token' };
        }
    }, [jwt]);

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={JSON.stringify(decoded, null, 2)} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 h-full">

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                            Encoded Token
                        </label>
                        <textarea
                            value={jwt}
                            onChange={(e) => setJwt(e.target.value)}
                            placeholder="Paste JWT here (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                            className="h-[120px] p-6 bg-workspace-sidebar border border-workspace-border rounded-2xl font-mono text-xs break-all outline-none focus:border-workspace-accent resize-none"
                        />
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                        {/* Header */}
                        <div className="flex flex-col gap-2 min-h-0">
                            <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                                Header
                            </label>
                            <div className="flex-1 bg-white border border-workspace-border rounded-2xl p-6 overflow-auto font-mono text-sm relative group">
                                {decoded?.error ? (
                                    <span className="text-red-500">{decoded.error}</span>
                                ) : (
                                    <pre>{JSON.stringify(decoded?.header || {}, null, 2)}</pre>
                                )}
                            </div>
                        </div>

                        {/* Payload */}
                        <div className="flex flex-col gap-2 min-h-0">
                            <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                                Payload
                            </label>
                            <div className="flex-1 bg-white border border-workspace-border rounded-2xl p-6 overflow-auto font-mono text-sm relative group">
                                {decoded?.error ? (
                                    <span className="text-red-500">{decoded.error}</span>
                                ) : (
                                    <pre className="text-workspace-accent">{JSON.stringify(decoded?.payload || {}, null, 2)}</pre>
                                )}
                            </div>
                        </div>
                    </div>

                    {decoded && !decoded.error && (
                        <div className="text-xs text-center text-workspace-secondary">
                            Signature: <span className="font-mono bg-workspace-sidebar px-2 py-1 rounded text-workspace-text">{decoded.signature.substring(0, 20)}...</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
