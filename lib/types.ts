// lib/types.ts
export interface FileContent {
  type: 'file';
  url: string;
  name: string;
  mimeType: string;
  meta?: {
    id: string;
    size: number;
    uploadedAt: number;
  };
}

export interface WorkflowStreamEvent {
  id: number;
  event: 'Message' | 'Error' | 'Done' | 'Interrupt';
  data: unknown;
}