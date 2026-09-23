// strategies/index.ts
import { type Node, type Edge } from '@xyflow/react';
import { type RefreshTrigger } from '../types/refreshTrigger';
import { handleUpdate } from './handleUpdate';
import { handleAdd } from './handleAdd';
import { handleDelete } from './handleDelete';
import type { RelativesResponse } from '../types/Responses';
import { handleClick } from './handleClick';
import { handleInjection } from './handleInjection';

export interface StrategyContext {
  trigger: RefreshTrigger;
  fetchedData: Record<string, RelativesResponse>;
  nodes: Node[];
  edges: Edge[];
  onDetailClick: (e: React.MouseEvent, id: string) => void; 
}

export interface GraphResult {
  nextNodes: Node[];
  nextEdges: Edge[];
  centerX?: number;
  centerY?: number;
}

export function processGraphUpdate(ctx: StrategyContext): GraphResult {
  switch (ctx.trigger.trigger) {
    case 'click':
      return handleClick(ctx);
    case 'update':
      return handleUpdate(ctx);
    case 'add':
      return handleAdd(ctx);
    case 'delete':
      return handleDelete(ctx);
    case 'inject':
      return handleInjection(ctx);
    default:
      return { nextNodes: ctx.nodes, nextEdges: ctx.edges };
  }
}