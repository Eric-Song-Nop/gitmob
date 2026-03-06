import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Redirect, router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ArrowLeftIcon } from 'lucide-react-native';

import { usePullRequests } from '@/api/queries/usePullRequests';
import { usePullRequest } from '@/api/queries/usePullRequest';
import { usePRDiff } from '@/api/queries/usePRDiff';
import { usePRComments } from '@/api/queries/usePRComments';
import { useCreateReview, type GitHubDraftComment } from '@/api/mutations/useCreateReview';
import type { PullRequest } from '@/api/types';
import type { SegmentCardModel } from '@/api/llm/types';
import { segmentPullRequest } from '@/api/llm/segmentPullRequest';
import { AmbientCanvas } from '@/components/review/AmbientCanvas';
import { ActionDock } from '@/components/review/ActionDock';
import { CommentOverlay } from '@/components/review/CommentOverlay';
import { FloatingProfileOrb } from '@/components/review/FloatingProfileOrb';
import { PRDeck } from '@/components/review/PRDeck';
import { ProgressPill } from '@/components/review/ProgressPill';
import { RepoPill } from '@/components/review/RepoPill';
import { SegmentDeck } from '@/components/review/SegmentDeck';
import { SubmitReviewOverlay } from '@/components/review/SubmitReviewOverlay';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { parseDiff } from '@/services/diffParser';
import { buildSegmentationInput } from '@/services/segmentation/buildSegmentationInput';
import { validateCoverage } from '@/services/segmentation/validateCoverage';
import { deriveReviewEvent, type SegmentDecision } from '@/services/review/deriveReviewEvent';
import { useAuthStore } from '@/stores/authStore';
import { useLLMConfigStore } from '@/stores/llmConfigStore';

const LOGIN_ROUTE = '/login' as Href;
const SETTINGS_ROUTE = '/settings' as Href;

type ReviewMode = 'pr-deck' | 'segment-deck' | 'submit-overlay';

interface CommentOverlayState {
  open: boolean;
  title: string;
  segmentId?: string;
  path?: string;
  line?: number;
}

function flattenPulls(data: ReturnType<typeof usePullRequests>['data']): PullRequest[] {
  return data?.pages.flatMap((page) => page.nodes) ?? [];
}

function buildReviewBody(segmentNotes: Record<string, string>) {
  const notes = Object.entries(segmentNotes)
    .filter(([, body]) => body.trim())
    .map(([segmentId, body]) => `- ${segmentId}: ${body.trim()}`);

  return notes.length ? `Segment notes\n${notes.join('\n')}` : '';
}

function EmptyDeck({ title, body, actionLabel, onAction }: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 justify-center px-5 pb-28 pt-24">
      <View className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-sm shadow-black/10">
        <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review Queue</Text>
        <Text variant="h3" className="mt-4 border-b-0 pb-0 text-left text-[30px] leading-[34px]">
          {title}
        </Text>
        <Text className="mt-4 text-base leading-7 text-muted-foreground">{body}</Text>
        {actionLabel && onAction ? (
          <Button className="mt-8 rounded-2xl" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const llmConfig = useLLMConfigStore((state) => state.config);

  const [mode, setMode] = useState<ReviewMode>('pr-deck');
  const [currentPRIndex, setCurrentPRIndex] = useState(0);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [flippedSegmentIds, setFlippedSegmentIds] = useState<string[]>([]);
  const [commentOverlay, setCommentOverlay] = useState<CommentOverlayState>({
    open: false,
    title: '',
  });
  const [decisions, setDecisions] = useState<Record<string, SegmentDecision>>({});
  const [segmentNotes, setSegmentNotes] = useState<Record<string, string>>({});
  const [inlineComments, setInlineComments] = useState<GitHubDraftComment[]>([]);

  const reviewRequestedQuery = usePullRequests('review-requested');
  const assignedQuery = usePullRequests('assigned');

  const reviewRequested = flattenPulls(reviewRequestedQuery.data);
  const assigned = flattenPulls(assignedQuery.data);
  const queue = reviewRequested.length > 0 ? reviewRequested : assigned;

  const activePR = queue[currentPRIndex] ?? null;
  const effectivePR = selectedPR ?? activePR;
  const owner = effectivePR?.repository.owner.login ?? '';
  const repo = effectivePR?.repository.name ?? '';
  const pullNumber = effectivePR?.number ?? 0;

  const detailQuery = usePullRequest(owner, repo, pullNumber);
  const diffQuery = usePRDiff(owner, repo, pullNumber);
  const commentsQuery = usePRComments(owner, repo, pullNumber);
  const createReview = useCreateReview();

  const parsedFiles = useMemo(() => {
    if (!diffQuery.data) return [];
    return parseDiff(diffQuery.data);
  }, [diffQuery.data]);

  const segmentationQuery = useQuery<SegmentCardModel[]>({
    queryKey: [
      'segments',
      owner,
      repo,
      pullNumber,
      detailQuery.data?.headRefOid,
      llmConfig.provider,
      llmConfig.model,
    ],
    enabled:
      !!effectivePR &&
      !!detailQuery.data &&
      parsedFiles.length > 0 &&
      !!llmConfig.apiKey.trim(),
    queryFn: async () => {
      const { input, flatHunks } = buildSegmentationInput(
        parsedFiles,
        detailQuery.data!.title,
        detailQuery.data?.body
      );
      const result = await segmentPullRequest(input, llmConfig);
      validateCoverage(result.segments, flatHunks);
      return result.segments;
    },
    staleTime: 1000 * 60 * 10,
  });

  const segments = segmentationQuery.data ?? [];
  const currentSegment = segments[currentSegmentIndex] ?? null;
  const nextSegment = segments[currentSegmentIndex + 1] ?? undefined;
  const currentFile = useMemo(() => {
    const targetPath = currentSegment?.refs[0]?.filePath;
    if (!targetPath) return parsedFiles[0];
    return (
      parsedFiles.find((file) => (file.newPath || file.oldPath) === targetPath) ?? parsedFiles[0]
    );
  }, [currentSegment, parsedFiles]);

  const currentThreads = commentsQuery.data ?? [];
  const reviewBody = useMemo(() => buildReviewBody(segmentNotes), [segmentNotes]);
  const reviewEvent = useMemo(
    () => deriveReviewEvent(Object.values(decisions)),
    [decisions]
  );
  const stats = useMemo(
    () => ({
      accepted: Object.values(decisions).filter((entry) => entry.status === 'accepted').length,
      concerns: Object.values(decisions).filter((entry) => entry.status === 'has-concern').length,
      comments: Object.values(decisions).filter((entry) => entry.status === 'commented').length,
      skipped: Object.values(decisions).filter((entry) => entry.status === 'skipped').length,
    }),
    [decisions]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState mode="spinner" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  const closeReview = () => {
    setMode('pr-deck');
    setSelectedPR(null);
    setCurrentSegmentIndex(0);
    setFlippedSegmentIds([]);
    setDecisions({});
    setSegmentNotes({});
    setInlineComments([]);
    setCommentOverlay({ open: false, title: '' });
  };

  const advanceSegment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSegmentIndex >= segments.length - 1) {
      setMode('submit-overlay');
      return;
    }
    setCurrentSegmentIndex((index) => index + 1);
  };

  const recordDecision = async (
    status: SegmentDecision['status'],
    options?: { blocking?: boolean }
  ) => {
    if (!currentSegment) return;
    setDecisions((state) => ({
      ...state,
      [currentSegment.id]: {
        segmentId: currentSegment.id,
        status,
        blocking: options?.blocking ?? false,
      },
    }));
    await advanceSegment();
  };

  const openSelectedPR = () => {
    if (!activePR) return;
    setSelectedPR(activePR);
    setCurrentSegmentIndex(0);
    setFlippedSegmentIds([]);
    setDecisions({});
    setSegmentNotes({});
    setInlineComments([]);
    setMode('segment-deck');
  };

  const skipPR = async () => {
    await Haptics.selectionAsync();
    setCurrentPRIndex((index) => index + 1);
  };

  const toggleFlip = async () => {
    if (!currentSegment) return;
    await Haptics.selectionAsync();
    setFlippedSegmentIds((state) =>
      state.includes(currentSegment.id)
        ? state.filter((id) => id !== currentSegment.id)
        : [...state, currentSegment.id]
    );
  };

  const openSegmentComment = async () => {
    if (!currentSegment) return;
    await Haptics.selectionAsync();
    setCommentOverlay({
      open: true,
      title: currentSegment.title,
      segmentId: currentSegment.id,
    });
  };

  const openInlineComment = async (path: string, line: number) => {
    if (!currentSegment) return;
    await Haptics.selectionAsync();
    setCommentOverlay({
      open: true,
      title: `${path}:${line}`,
      path,
      line,
      segmentId: currentSegment.id,
    });
  };

  const submitComment = async (body: string) => {
    const target = commentOverlay;
    if (!target.segmentId) return;

    if (target.path != null && target.line != null) {
      const path = target.path;
      const line = target.line;
      setInlineComments((state) => [
        ...state,
        { path, line, side: 'RIGHT', body },
      ]);
    } else {
      setSegmentNotes((state) => ({
        ...state,
        [target.segmentId!]: body,
      }));
    }

    setDecisions((state) => ({
      ...state,
      [target.segmentId!]: {
        segmentId: target.segmentId!,
        status: 'commented',
        blocking: false,
      },
    }));
    setCommentOverlay({ open: false, title: '' });
    await advanceSegment();
  };

  const submitReview = async (body: string) => {
    if (!detailQuery.data) return;

    try {
      await createReview.mutateAsync({
        owner: detailQuery.data.repository.owner.login,
        repo: detailQuery.data.repository.name,
        pullNumber: detailQuery.data.number,
        event: reviewEvent,
        body,
        comments: inlineComments,
        commitId: detailQuery.data.headRefOid,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeReview();
      setCurrentPRIndex((index) => index + 1);
    } catch (error) {
      Alert.alert('Review failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const topOffset = insets.top + 12;

  return (
    <View className="flex-1 bg-background">
      <AmbientCanvas />

      <View
        className="absolute left-4 right-4 z-10 flex-row items-center justify-between"
        style={{ top: topOffset }}
      >
        <View className="flex-row items-center gap-2">
          {mode !== 'pr-deck' ? (
            <Pressable
              onPress={closeReview}
              className="h-12 w-12 items-center justify-center rounded-full border border-border bg-card/85"
            >
              <Icon as={ArrowLeftIcon} size={18} />
            </Pressable>
          ) : null}
          <ProgressPill
            label={
              mode === 'pr-deck'
                ? `Queue ${Math.min(currentPRIndex + 1, Math.max(queue.length, 1))}/${Math.max(queue.length, 1)}`
                : `Segment ${Math.min(currentSegmentIndex + 1, Math.max(segments.length, 1))}/${Math.max(segments.length, 1)}`
            }
          />
          {effectivePR ? <RepoPill repo={effectivePR.repository.nameWithOwner} /> : null}
        </View>

        <FloatingProfileOrb user={user} onPress={() => router.push(SETTINGS_ROUTE)} />
      </View>

      {mode === 'pr-deck' ? (
        reviewRequestedQuery.isPending && assignedQuery.isPending ? (
          <LoadingState mode="spinner" />
        ) : activePR ? (
          <PRDeck
            current={activePR}
            next={queue[currentPRIndex + 1]}
            onOpenReview={openSelectedPR}
            onSkip={skipPR}
          />
        ) : (
          <EmptyDeck
            title="No review requests right now"
            body="Nothing is waiting in review-requested or assigned. Pull to refresh later, or switch accounts in settings."
            actionLabel="Open Settings"
            onAction={() => router.push(SETTINGS_ROUTE)}
          />
        )
      ) : (
        <>
          {detailQuery.isPending || diffQuery.isPending ? (
            <LoadingState mode="spinner" />
          ) : detailQuery.error || diffQuery.error ? (
            <EmptyDeck
              title="This pull request could not be loaded"
              body={(detailQuery.error ?? diffQuery.error)?.message ?? 'Unknown error'}
              actionLabel="Back to Queue"
              onAction={closeReview}
            />
          ) : !llmConfig.apiKey.trim() ? (
            <EmptyDeck
              title="Add an LLM API key first"
              body="Segmentation is required for this review flow. Configure your provider, model, and API key in settings, then reopen the PR."
              actionLabel="Open Settings"
              onAction={() => router.push(SETTINGS_ROUTE)}
            />
          ) : segmentationQuery.isPending ? (
            <LoadingState mode="spinner" />
          ) : segmentationQuery.error ? (
            <EmptyDeck
              title="Segmentation did not complete"
              body={segmentationQuery.error.message}
              actionLabel="Back to Queue"
              onAction={closeReview}
            />
          ) : currentSegment && currentFile ? (
            <>
              <SegmentDeck
                segment={currentSegment}
                nextSegment={nextSegment}
                isFlipped={flippedSegmentIds.includes(currentSegment.id)}
                onFlip={toggleFlip}
                file={currentFile}
                threads={currentThreads}
                onLinePress={openInlineComment}
              />
              <ActionDock
                onAccept={() => recordDecision('accepted')}
                onConcern={() => recordDecision('has-concern', { blocking: true })}
                onComment={openSegmentComment}
                onSkip={() => recordDecision('skipped')}
                onSubmit={() => setMode('submit-overlay')}
              />
            </>
          ) : (
            <EmptyDeck
              title="No segments were returned"
              body="The diff parsed correctly, but no mobile review cards were produced."
              actionLabel="Back to Queue"
              onAction={closeReview}
            />
          )}
        </>
      )}

      <CommentOverlay
        open={commentOverlay.open}
        title={commentOverlay.title}
        onClose={() => setCommentOverlay({ open: false, title: '' })}
        onSubmit={submitComment}
      />

      <SubmitReviewOverlay
        open={mode === 'submit-overlay'}
        event={reviewEvent}
        stats={stats}
        initialBody={reviewBody}
        isSubmitting={createReview.isPending}
        onClose={() => setMode('segment-deck')}
        onSubmit={submitReview}
      />
    </View>
  );
}
