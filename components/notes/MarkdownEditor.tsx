
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { SlashCommand, suggestionOptions } from './SlashCommandExtension';

interface MarkdownEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    content,
    onChange,
    placeholder = 'Start typing...',
    className = '',
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            SlashCommand.configure({
                suggestion: suggestionOptions,
            }),
            Markdown.configure({
                html: false,
                transformPastedText: true,
                transformCopiedText: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none ${className}`,
            },
        },
        onUpdate: ({ editor }) => {
            // Get markdown content
            const markdown = (editor.storage as any).markdown.getMarkdown();
            onChange(markdown);
        },
    });

    // Handle external content updates
    useEffect(() => {
        if (!editor) return;

        // Compare current editor content (as markdown) with the new prop
        // This prevents cursor jumping and infinite loops
        const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
        if (content !== currentMarkdown) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return <EditorContent editor={editor} className="h-full" />;
};
