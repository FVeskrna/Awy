export type StickyColor = 'yellow' | 'orange' | 'pink' | 'red' | 'blue' | 'teal' | 'green' | 'purple';

export interface StickyItem {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  color: StickyColor;
  content: string;
  width?: number;
  height?: number;
}

export interface ModuleRefItem {
  id: string;
  type: 'module_ref';
  x: number;
  y: number;
  moduleId: 'tasks' | 'notes';
  refId: string;
  color?: StickyColor;
}

export type WhiteboardItem = StickyItem | ModuleRefItem;

export interface Whiteboard {
  id: string;
  name: string;
  createdAt: string;
  items: WhiteboardItem[];
}
