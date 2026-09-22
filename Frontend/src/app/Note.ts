export interface Note {
  id?: number;
  title: string;
  tags: string[];
  content: string;
  // Set by the backend. Optional so existing call sites that build a Note
  // before saving it still compile.
  isPinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
