
import {
  CheckSquare, Music, Grid, Wrench, Brain,
  Activity, ListTodo, Zap, IceCream, Globe, Camera
} from 'lucide-react';
import React from 'react';
import { ModuleManifest } from '../types';
import { TaskWidget, TaskApp } from '../components/modules/TaskModule';
import { MusicWidget, MusicApp } from '../components/modules/MusicModule';
import { NotesWidget, NotesApp } from '../components/modules/NotesModule';
import { ToolboxWidget, ToolboxApp } from '../components/modules/ToolboxModule';
import { DeepWorkWidget, DeepWorkApp } from '../components/modules/DeepWorkModule';
import { HealthWidget, HealthApp } from '../components/modules/HealthModule';
import { ChecklistWidget, ChecklistApp } from '../components/modules/ChecklistModule';
import { MentalLoadWidget, MentalLoadApp } from '../components/modules/MentalLoadModule';
import { FridgeWidget, FridgeApp } from '../components/modules/FridgeModule';
import { MeetingNavigatorWidget, MeetingNavigatorApp } from '../components/modules/MeetingNavigatorModule';
import { AssetWidget, AssetApp } from '../components/modules/AssetModule';

export const MODULES: Record<string, ModuleManifest> = {
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    description: 'Manage your daily to-dos',
    AppComponent: TaskApp,
    WidgetComponent: TaskWidget,
  },
  checklist: {
    id: 'checklist',
    name: 'Checklist',
    icon: ListTodo,
    description: 'Daily habits and streaks',
    AppComponent: ChecklistApp,
    WidgetComponent: ChecklistWidget,
  },
  mentalload: {
    id: 'mentalload',
    name: 'Capacity',
    icon: Zap,
    description: 'Track mental bandwidth',
    AppComponent: MentalLoadApp,
    WidgetComponent: MentalLoadWidget,
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
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    icon: Grid,
    description: 'Thoughts and lists',
    AppComponent: NotesApp,
    WidgetComponent: NotesWidget,
  },
  meeting: {
    id: 'meeting',
    name: 'Navigator',
    icon: Globe,
    description: 'Global time-zone sync',
    AppComponent: MeetingNavigatorApp,
    WidgetComponent: MeetingNavigatorWidget,
  },
  fridge: {
    id: 'fridge',
    name: 'Snippet Storage',
    icon: IceCream,
    description: 'Quick snippets gallery',
    AppComponent: FridgeApp,
    WidgetComponent: FridgeWidget,
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
  },
};

export const getModule = (id: string) => MODULES[id];
export const getAllModules = () => Object.values(MODULES);
