import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, Scissors, Merge, Download } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { toolRegistry } from '../../../config/toolRegistry';

export const PdfManager: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'pdf')!;
    const [files, setFiles] = useState<File[]>([]);
    const [mode, setMode] = useState<'merge' | 'split'>('merge');
    const [splitRange, setSplitRange] = useState('1'); // e.g., "1-3, 5"
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const mergePdfs = async () => {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        downloadPdf(pdfBytes, 'merged-document.pdf');
    };

    const splitPdf = async () => {
        if (files.length === 0) return;
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();
        const totalPages = pdf.getPageCount();

        // Parse range "1-3, 5"
        const pageIndices = new Set<number>();
        const parts = splitRange.split(',').map(p => p.trim());

        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i > 0 && i <= totalPages) pageIndices.add(i - 1);
                    }
                }
            } else {
                const pageNum = Number(part);
                if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                    pageIndices.add(pageNum - 1);
                }
            }
        });

        const sortedIndices = Array.from(pageIndices).sort((a, b) => a - b);
        const copiedPages = await newPdf.copyPages(pdf, sortedIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        downloadPdf(pdfBytes, `split-${file.name}`);
    };

    const downloadPdf = (bytes: Uint8Array, name: string) => {
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto flex flex-col gap-8">

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-workspace-sidebar rounded-xl border border-workspace-border self-center">
                        <button
                            onClick={() => { setMode('merge'); setFiles([]); }}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'merge' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                        >
                            <Merge size={16} /> Merge
                        </button>
                        <button
                            onClick={() => { setMode('split'); setFiles([]); }}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'split' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                        >
                            <Scissors size={16} /> Split
                        </button>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-workspace-border hover:border-workspace-accent rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-white cursor-pointer transition-colors group"
                    >
                        <input
                            type="file"
                            multiple={mode === 'merge'}
                            accept=".pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-workspace-text">
                                {mode === 'merge' ? 'Drop PDFs here' : 'Drop a PDF here'}
                            </h3>
                            <p className="text-workspace-secondary text-sm">or click to browse</p>
                        </div>
                    </div>

                    {/* File List / Controls */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-2xl border border-workspace-border p-6 shadow-sm">
                            <div className="space-y-2 mb-6">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-workspace-sidebar rounded-lg">
                                        <FileText size={20} className="text-red-400" />
                                        <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                                        <span className="text-xs text-workspace-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col items-end gap-4">
                                {mode === 'split' && (
                                    <div className="w-full">
                                        <label className="text-xs font-bold uppercase tracking-widest text-workspace-secondary mb-2 block">Page Range</label>
                                        <input
                                            type="text"
                                            value={splitRange}
                                            onChange={(e) => setSplitRange(e.target.value)}
                                            placeholder="e.g. 1-3, 5, 8-10"
                                            className="w-full p-3 bg-workspace-canvas border border-workspace-border rounded-lg text-sm font-mono"
                                        />
                                        <p className="text-[10px] text-workspace-secondary mt-1">Comma-separated page numbers or ranges (1-indexed)</p>
                                    </div>
                                )}

                                <button
                                    onClick={mode === 'merge' ? mergePdfs : splitPdf}
                                    className="flex items-center gap-2 px-6 py-3 bg-workspace-accent text-white rounded-xl font-bold shadow-lg shadow-workspace-accent/20 hover:bg-workspace-accent/90 transition-all active:scale-95"
                                >
                                    <Download size={18} />
                                    {mode === 'merge' ? 'Merge PDFs' : 'Split PDF'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
