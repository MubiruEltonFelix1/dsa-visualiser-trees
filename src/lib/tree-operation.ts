import type { RNode } from './traversal';

export interface TreeFrame<T> {
  tree: T | null;
  title: string;
  note: string;
  property: string;
  line: number;
  focus: number | null;
  path: number[];
  rotations?: number;
  recolors?: number;
  context?: Record<string, number | null>;
}
export interface TreeOperation<T> {
  label: string;
  kind: 'insert' | 'delete' | 'search';
  after: T | null;
  frames: TreeFrame<T>[];
  rotations: number;
  recolors: number;
}
export interface TreeExample { label: string; values: number[]; delete?: number }
export interface AdvancedAdapter<T> {
  name: string;
  binary: boolean;
  insert: (root: T | null, values: number[]) => TreeOperation<T>;
  remove: (root: T | null, value: number) => TreeOperation<T>;
  search: (root: T | null, value: number) => TreeOperation<T>;
  render: (root: T | null) => RNode | null;
  stats: (root: T | null) => [string, string | number][];
  validate: (root: T | null) => string[];
  examples: TreeExample[];
  code: Record<TreeOperation<T>['kind'], string[]>;
}