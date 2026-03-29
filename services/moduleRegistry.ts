import {
  CheckSquare, Music, Grid, Wrench, Brain,
  Activity, ListTodo, Zap, IceCream, Globe, Camera, Layers,
  Plus, Play, LayoutTemplate
} from 'lucide-react';
import React from 'react';
import { ModuleManifest } from '../types';
import { TaskWidget, TaskApp } from '../components/modules/tasks';
import { MusicWidget, MusicApp } from '../components/modules/MusicModule';
import { NotesWidget, NotesApp } from '../components/modules/notes';
import { ToolboxWidget, ToolboxApp } from '../components/modules/ToolboxModule';
import { DeepWorkWidget, DeepWorkApp } from '../components/modules/DeepWorkModule';
import { HealthWidget, HealthApp } from '../components/modules/HealthModule';
import { ChecklistWidget, ChecklistApp } from '../components/modules/ChecklistModule';
import { MentalLoadWidget, MentalLoadApp } from '../components/modules/MentalLoadModule';
import { FridgeWidget, FridgeApp } from '../components/modules/FridgeModule';
import { MeetingNavigatorWidget, MeetingNavigatorApp } from '../components/modules/MeetingNavigatorModule';
import { AssetWidget, AssetApp } from '../components/modules/AssetModule';
import { WorklogStreamWidget, WorklogApp as WorklogStreamApp } from '../components/modules/worklogs';
import { WhiteboardApp, WhiteboardWidget } from '../components/modules/whiteboard';
import { TaskRefCard } from '../components/modules/whiteboard/ref-cards/TaskRefCard';
import { NoteRefCard } from '../components/modules/whiteboard/ref-cards/NoteRefCard';

export const MODULES: Record<string, ModuleManifest> = {
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    description: 'Manage your daily to-dos',
    AppComponent: TaskApp,
    WidgetComponent: TaskWidget,
    quickAction: { label: 'New Task', hash: '#tasks?action=create', icon: Plus },
    WhiteboardRefCard: TaskRefCard,
  },
  checklist: {
    id: 'checklist',
    name: 'Checklist',
    icon: ListTodo,
    description: 'Daily habits and streaks',
    AppComponent: ChecklistApp,
    WidgetComponent: ChecklistWidget,
    quickAction: { label: 'New Habit', hash: '#checklist?action=create', icon: Plus },
  },
  mentalload: {
    id: 'mentalload',
    name: 'Capacity',
    icon: Zap,
    description: 'Track mental bandwidth',
    AppComponent: MentalLoadApp,
    WidgetComponent: MentalLoadWidget,
    quickAction: { label: 'Log Entry', hash: '#mentalload?action=log', icon: Plus },
  },
  deepwork: {
    id: 'deepwork',
    name: 'Deep Work',
    icon: Brain,
    description: 'High-focus timer',
    AppComponent: (props: any) => {
      return React.createElement(DeepWorkApp, {
        ...props,
        onExit: props.onExit || (() => window.location.hash = '#dashboard')
      });
    },
    WidgetComponent: DeepWorkWidget,
    quickAction: { label: 'Start Session', hash: '#deepwork', icon: Play },
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    icon: Grid,
    description: 'Thoughts and lists',
    AppComponent: NotesApp,
    WidgetComponent: NotesWidget,
    quickAction: { label: 'New Note', hash: '#notes?action=create', icon: Plus },
    WhiteboardRefCard: NoteRefCard,
  },
  meeting: {
    id: 'meeting',
    name: 'Navigator',
    icon: Globe,
    description: 'Global time-zone sync',
    AppComponent: MeetingNavigatorApp,
    WidgetComponent: MeetingNavigatorWidget,
    quickAction: { label: 'Add Location', hash: '#meeting?action=create', icon: Plus },
  },
  fridge: {
    id: 'fridge',
    name: 'Snippet Storage',
    icon: IceCream,
    description: 'Quick snippets gallery',
    AppComponent: FridgeApp,
    WidgetComponent: FridgeWidget,
    quickAction: { label: 'New Snippet', hash: '#fridge?action=create', icon: Plus },
  },
  toolbox: {
    id: 'toolbox',
    name: 'Toolbox',
    icon: Wrench,
    description: 'Developer utilities',
    AppComponent: ToolboxApp,
    WidgetComponent: ToolboxWidget,
  },
  music: {
    id: 'music',
    name: 'Soundscape',
    icon: Music,
    description: 'Focus Audio Mixer',
    AppComponent: MusicApp,
    WidgetComponent: MusicWidget,
  },
  health: {
    id: 'health',
    name: 'Health',
    icon: Activity,
    description: 'System & Network Pulse',
    AppComponent: HealthApp,
    WidgetComponent: HealthWidget,
  },
  asset: {
    id: 'asset',
    name: 'Smart Asset',
    icon: Camera,
    description: 'Warranty & Receipt Scanner',
    AppComponent: AssetApp,
    WidgetComponent: AssetWidget,
    quickAction: { label: 'Add Asset', hash: '#asset?action=create', icon: Plus },
  },
  worklog: {
    id: 'worklog',
    name: 'Worklog Stream',
    icon: Layers,
    description: 'High-speed manual Jira entry',
    AppComponent: WorklogStreamApp,
    WidgetComponent: WorklogStreamWidget,
    quickAction: { label: 'Log Work', hash: '#worklog?action=log', icon: Plus },
  },
  whiteboard: {
    id: 'whiteboard',
    name: 'Whiteboard',
    icon: LayoutTemplate,
    description: 'Visual infinite canvas for ideas',
    AppComponent: WhiteboardApp,
    WidgetComponent: WhiteboardWidget,
  },
};

export const getModule = (id: string) => MODULES[id];
export const getAllModules = () => Object.values(MODULES);
