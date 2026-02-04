
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
export interface ModuleManifest {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string }>;
  description: string;
  AppComponent: React.ComponentType;
  WidgetComponent: React.ComponentType<{ isEditMode: boolean }>;
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
}

// --- Task Models ---
export type TaskPriority = 'high' | 'medium' | 'low';
export interface Task {
  id: string;
  parentId?: string;
  title: string;
  isFocused: boolean;
  priority: TaskPriority;
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
