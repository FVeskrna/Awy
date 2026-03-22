
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
    Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, X
} from 'lucide-react';

export const SlashCommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="bg-white rounded-xl shadow-xl border border-workspace-border overflow-hidden min-w-[200px] p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-workspace-secondary border-b border-workspace-border/30 mb-1">
                Format
            </div>
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg transition-colors ${index === selectedIndex ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-text hover:bg-workspace-sidebar'
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        {item.icon}
                        <div className="flex flex-col">
                            <span className="font-bold text-[13px]">{item.title}</span>
                            {item.description && <span className="text-[10px] text-workspace-secondary font-medium">{item.description}</span>}
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-workspace-secondary">No result</div>
            )}
        </div>
    );
});

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: 'Heading 1',
            description: 'Big section heading',
            searchTerms: ['h1', 'heading', 'title'],
            icon: <Heading1 size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading',
            searchTerms: ['h2', 'subtitle', 'heading'],
            icon: <Heading2 size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading',
            searchTerms: ['h3', 'subtitle', 'heading'],
            icon: <Heading3 size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: 'Bullet List',
            description: 'Create a simple list',
            searchTerms: ['list', 'bullet', 'unordered'],
            icon: <List size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Numbered List',
            description: 'Create a list with numbers',
            searchTerms: ['list', 'numbered', 'ordered'],
            icon: <ListOrdered size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: 'Task List',
            description: 'Track items with checkboxes',
            searchTerms: ['todo', 'task', 'check', 'box'],
            icon: <CheckSquare size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: 'Blockquote',
            description: 'Capture a quote',
            searchTerms: ['quote', 'blockquote'],
            icon: <Quote size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: 'Code Block',
            description: 'Capture a code snippet',
            searchTerms: ['code', 'pre'],
            icon: <Code size={16} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
    ].filter((item) => {
        if (typeof query === 'string' && query.length > 0) {
            const search = query.toLowerCase();
            return (
                item.title.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
            );
        }
        return true;
    });
};
