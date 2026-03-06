export interface SegmentDecision {
  segmentId: string;
  status: 'accepted' | 'has-concern' | 'commented' | 'skipped';
  blocking: boolean;
}

export function deriveReviewEvent(decisions: SegmentDecision[]) {
  if (decisions.some((decision) => decision.status === 'has-concern' && decision.blocking)) {
    return 'REQUEST_CHANGES' as const;
  }

  if (decisions.some((decision) => decision.status === 'accepted')) {
    return 'APPROVE' as const;
  }

  return 'COMMENT' as const;
}
