
import React from 'react';

// --- Auth & User ---
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  signInGuest: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

// --- Module System ---
export interface QuickAction {
  label: string;
  hash: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

export interface ModuleManifest {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string }>;
  description: string;
  AppComponent: React.ComponentType;
  WidgetComponent: React.ComponentType<{ isEditMode: boolean }>;
  quickAction?: QuickAction;
}

export type ViewState = 'dashboard' | 'profile' | string;

// --- Fridge Models ---
export interface Snippet {
  id: string;
  title: string;
  content: string;
  language: string;
  tag: string;
  updatedAt: number;
  isPinned?: boolean;
}

// --- Task Models ---
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'wont_do';

export interface Task {
  id: string;
  parentId?: string;
  title: string;
  isFocused: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  estimate: string;
  dueDate: string;
  category?: string;
  completed: boolean;
  createdAt: number;
}

// --- Note Models ---
export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
}

export interface FolderType {
  id: string;
  name: string;
  color: string;
}

// --- Checklist Models ---
export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  lastCompletedDate: string | null;
}

export interface ChecklistData {
  lastResetDate: string;
  items: Habit[];
}

// --- Capacity Models ---
export interface LoadEntry {
  level: number;
  note: string;
  chips: string[];
  timestamp: number;
}

// --- Meeting Models ---
export interface MeetingLocation {
  id: string;
  label: string;
  timezone: string;
  workStart: number;
  workEnd: number;
  isPrimary: boolean;
}

// --- Asset Models ---
export interface Asset {
  id: string;
  productName: string;
  storeName: string;
  purchaseDate: string;
  price: number | string;
  currency: string;
  warrantyDurationMonths: number | string;
  receiptUrl: string;
  createdAt: string;
}

// --- Dashboard Models ---
export interface DashboardWidget {
  id: string; // unique instance ID
  moduleId: string;
  x: number;
  y: number;
  w: number;
  h: number; // grid units
}

export interface DashboardLayout {
  id: string;
  user_id: string;
  layout_json: DashboardWidget[];
}

// --- Worklog Models ---
export interface Worklog {
  id: string;
  user_id: string;
  work_item: string | null;
  raw_content: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  date: string;
}
