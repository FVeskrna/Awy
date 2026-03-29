import { LayoutTemplate } from 'lucide-react';
import { ModuleManifest } from '../../../types';
import { WhiteboardApp } from './WhiteboardApp';
import { WhiteboardWidget } from './widgets/WhiteboardWidget';

export const whiteboardManifest: ModuleManifest = {
  id: 'whiteboard',
  name: 'Whiteboard',
  icon: LayoutTemplate,
  description: 'Visual infinite canvas for ideas',
  AppComponent: WhiteboardApp,
  WidgetComponent: WhiteboardWidget,
};
