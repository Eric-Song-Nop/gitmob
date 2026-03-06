export interface HunkReference {
  filePath: string;
  hunkKey: string;
  header: string;
  additions: number;
  deletions: number;
  summaryText: string;
}

export interface SegmentationInput {
  prTitle: string;
  prBody?: string;
  files: Array<{
    path: string;
    hunks: HunkReference[];
  }>;
}

export interface SegmentCardModel {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  risk: 'low' | 'medium' | 'high';
  refs: Array<{
    filePath: string;
    hunkKey: string;
  }>;
}

export interface SegmentationResult {
  segments: SegmentCardModel[];
}
