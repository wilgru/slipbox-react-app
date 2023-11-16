import Delta from "quill-delta";

export type Slip = {
  id: string;
  title: string | null;
  content: Delta | null; // only containing the 'ops' types, none of the methods
  isPinned: boolean;
};
