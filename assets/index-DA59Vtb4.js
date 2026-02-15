import{t as i,j as e}from"./index-DXbWC80Q.js";import{T as f}from"./ToolHeader-D6CNKsOu.js";import{u as r}from"./usePersistentState-CG8BFXCJ.js";const u=()=>{const s=i.find(o=>o.id==="diff"),[a,n]=r("diff_a",`Line 1
Line 2
Line 3`),[t,l]=r("diff_b",`Line 1
Line 2 changed
Line 3
Line 4`);return e.jsxs("div",{className:"flex flex-col h-full",children:[e.jsx(f,{tool:s}),e.jsx("div",{className:"flex-1 overflow-y-auto p-10 no-scrollbar",children:e.jsx("div",{className:"flex flex-col gap-6 h-full",children:e.jsxs("div",{className:"grid grid-cols-2 gap-6 h-1/2",children:[e.jsx("textarea",{value:a,onChange:o=>n(o.target.value),className:"flex-1 p-4 bg-workspace-sidebar border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent"}),e.jsx("textarea",{value:t,onChange:o=>l(o.target.value),className:"flex-1 p-4 bg-workspace-sidebar border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent"})]})})})]})};export{u as DiffTool};
