import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Redirect, router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import * as Linking from 'expo-linking';
import { ArrowLeftIcon } from 'lucide-react-native';

import { usePRInbox } from '@/api/queries/usePRInbox';
import { usePullRequest } from '@/api/queries/usePullRequest';
import { usePRDiff } from '@/api/queries/usePRDiff';
import { usePRComments } from '@/api/queries/usePRComments';
import { useCreateReview, type GitHubDraftComment } from '@/api/mutations/useCreateReview';
import { useMergePullRequest } from '@/api/mutations/useMergePullRequest';
import type { MergeMethod, PullRequest, ReviewMode as CapabilityReviewMode } from '@/api/types';
import type { SegmentCardModel } from '@/api/llm/types';
import { segmentPullRequest } from '@/api/llm/segmentPullRequest';
import { AmbientCanvas } from '@/components/review/AmbientCanvas';
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
import { usePRInboxStore } from '@/stores/prInboxStore';

const LOGIN_ROUTE = '/login' as Href;
const SETTINGS_ROUTE = '/settings' as Href;

type ReviewMode = 'pr-deck' | 'segment-deck' | 'submit-overlay';
type InboxMode = 'front' | 'peek';
type SubmitMode = CapabilityReviewMode;

interface CommentOverlayState {
  open: boolean;
  title: string;
  segmentId?: string;
  path?: string;
  line?: number;
}

function buildReviewBody(segmentNotes: Record<string, string>) {
  const notes = Object.entries(segmentNotes)
    .filter(([, body]) => body.trim())
    .map(([segmentId, body]) => `- ${segmentId}: ${body.trim()}`);

  return notes.length ? `Segment notes\n${notes.join('\n')}` : '';
}

function getSubmitMode(mode?: CapabilityReviewMode): SubmitMode {
  if (mode === 'self-merge') return 'self-merge';
  if (mode === 'read-only') return 'read-only';
  return 'full-review';
}

function formatReadOnlyReason(reason?: string) {
  switch (reason) {
    case 'no-review-permission':
      return "You can still review this change path, but you can't submit a formal GitHub review.";
    case 'draft':
      return 'This pull request is still draft-only for formal review actions.';
    default:
      return 'Formal review submission is not available for this pull request.';
  }
}

function formatMergeBlockedReasons(reasons: string[]) {
  if (!reasons.length) return '';

  const labels = reasons.map((reason) => {
    switch (reason) {
      case 'no-merge-permission':
        return 'missing permission';
      case 'conflicts':
        return 'conflicts';
      case 'draft':
        return 'draft state';
      case 'checks-pending':
        return 'pending checks';
      case 'checks-failed':
        return 'failed checks';
      default:
        return 'unknown state';
    }
  });

  return `Merge is blocked by ${labels.join(', ')}.`;
}

function EmptyDeck({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 justify-center px-5 pb-28 pt-24">
      <View className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-sm shadow-black/10">
        <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">PR Inbox</Text>
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
  const { clearSnoozed, snoozePR } = usePRInboxStore();
  const inbox = usePRInbox();

  const [mode, setMode] = useState<ReviewMode>('pr-deck');
  const [inboxMode, setInboxMode] = useState<InboxMode>('front');
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

  const activeInboxItem = inbox.items[currentPRIndex] ?? null;
  const effectivePR = selectedPR ?? activeInboxItem?.pullRequest ?? null;
  const owner = effectivePR?.repository.owner.login ?? '';
  const repo = effectivePR?.repository.name ?? '';
  const pullNumber = effectivePR?.number ?? 0;

  const shouldLoadDetail = !!effectivePR && (mode !== 'pr-deck' || inboxMode === 'peek');
  const detailQuery = usePullRequest(owner, repo, pullNumber, user?.login, shouldLoadDetail);
  const diffQuery = usePRDiff(owner, repo, pullNumber, mode !== 'pr-deck');
  const commentsQuery = usePRComments(owner, repo, pullNumber, mode !== 'pr-deck');
  const createReview = useCreateReview();
  const mergePullRequest = useMergePullRequest();

  useEffect(() => {
    if (currentPRIndex >= inbox.items.length) {
      setCurrentPRIndex(Math.max(inbox.items.length - 1, 0));
    }
  }, [currentPRIndex, inbox.items.length]);

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
      mode !== 'pr-deck' &&
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
      if (result.qualitySignals.length) {
        console.warn('[segmentation] quality signals', result.qualitySignals);
      }
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
  const reviewEvent = useMemo(() => deriveReviewEvent(Object.values(decisions)), [decisions]);
  const submitMode = getSubmitMode(detailQuery.data?.capabilities.review.mode);
  const allowedMergeMethods = detailQuery.data?.capabilities.merge.allowedMethods ?? ['squash'];
  const [selectedMergeMethod, setSelectedMergeMethod] = useState<MergeMethod>('squash');
  const stats = useMemo(
    () => ({
      accepted: Object.values(decisions).filter((entry) => entry.status === 'accepted').length,
      concerns: Object.values(decisions).filter((entry) => entry.status === 'has-concern').length,
      comments: Object.values(decisions).filter((entry) => entry.status === 'commented').length,
      skipped: Object.values(decisions).filter((entry) => entry.status === 'skipped').length,
    }),
    [decisions]
  );
  const canSubmitReview = useMemo(() => {
    const capabilities = detailQuery.data?.capabilities.review;
    if (!capabilities) return true;
    if (reviewEvent === 'APPROVE') return capabilities.canSubmitApprove;
    if (reviewEvent === 'REQUEST_CHANGES') return capabilities.canSubmitRequestChanges;
    return capabilities.canSubmitComment;
  }, [detailQuery.data?.capabilities.review, reviewEvent]);

  useEffect(() => {
    if (!allowedMergeMethods.length) return;
    setSelectedMergeMethod((current) =>
      allowedMergeMethods.includes(current)
        ? current
        : allowedMergeMethods.includes('squash')
          ? 'squash'
          : allowedMergeMethods[0]
    );
  }, [allowedMergeMethods]);

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

  const resetReviewSession = () => {
    setCurrentSegmentIndex(0);
    setFlippedSegmentIds([]);
    setDecisions({});
    setSegmentNotes({});
    setInlineComments([]);
    setCommentOverlay({ open: false, title: '' });
  };

  const closeReview = () => {
    setMode('pr-deck');
    setInboxMode('front');
    setSelectedPR(null);
    resetReviewSession();
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

  const openSelectedPR = async () => {
    if (!activeInboxItem) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedPR(activeInboxItem.pullRequest);
    setInboxMode('front');
    resetReviewSession();
    setMode('segment-deck');
  };

  const saveForLater = async () => {
    if (!activeInboxItem) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    snoozePR(activeInboxItem.prKey);
    setInboxMode('front');
  };

  const togglePeek = async () => {
    if (!activeInboxItem) return;
    await Haptics.selectionAsync();
    setInboxMode((state) => (state === 'front' ? 'peek' : 'front'));
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
    const segmentId = target.segmentId;

    if (target.path != null && target.line != null) {
      const path = target.path;
      const line = target.line;
      setInlineComments((state) => [...state, { path, line, side: 'RIGHT', body }]);
    } else {
      setSegmentNotes((state) => ({
        ...state,
        [segmentId]: body,
      }));
    }

    setDecisions((state) => ({
      ...state,
      [segmentId]: {
        segmentId,
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

  const postComment = async (body: string) => {
    if (!detailQuery.data) return;

    try {
      await createReview.mutateAsync({
        owner: detailQuery.data.repository.owner.login,
        repo: detailQuery.data.repository.name,
        pullNumber: detailQuery.data.number,
        event: 'COMMENT',
        body,
        comments: inlineComments,
        commitId: detailQuery.data.headRefOid,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeReview();
      setCurrentPRIndex((index) => index + 1);
    } catch (error) {
      Alert.alert('Comment failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const mergePR = async (body: string) => {
    if (!detailQuery.data) return;

    try {
      await mergePullRequest.mutateAsync({
        owner: detailQuery.data.repository.owner.login,
        repo: detailQuery.data.repository.name,
        pullNumber: detailQuery.data.number,
        method: selectedMergeMethod,
        commitMessage: body.trim() || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeReview();
      setCurrentPRIndex((index) => index + 1);
    } catch (error) {
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const copyNotes = async (body: string) => {
    await Clipboard.setStringAsync(body || reviewBody || 'No notes recorded.');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openOnGitHub = async () => {
    if (!detailQuery.data?.url) return;
    await Linking.openURL(detailQuery.data.url);
  };

  const topOffset = insets.top + 12;
  const visibleCount = inbox.items.length;
  const progressIndex = Math.min(currentPRIndex + 1, Math.max(visibleCount, 1));

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
                ? `Inbox ${progressIndex}/${Math.max(visibleCount, 1)}`
                : `Segment ${Math.min(currentSegmentIndex + 1, Math.max(segments.length, 1))}/${Math.max(segments.length, 1)}`
            }
          />
          {effectivePR ? <RepoPill repo={effectivePR.repository.nameWithOwner} /> : null}
          {mode === 'segment-deck' ? (
            <Pressable onPress={() => setMode('submit-overlay')}>
              <BlurView
                intensity={28}
                tint="default"
                className="overflow-hidden rounded-full border border-border/80 px-3 py-2"
              >
                <Text className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Summary
                </Text>
              </BlurView>
            </Pressable>
          ) : null}
        </View>

        <FloatingProfileOrb user={user} onPress={() => router.push(SETTINGS_ROUTE)} />
      </View>

      {mode === 'pr-deck' ? (
        inbox.isPending ? (
          <LoadingState mode="spinner" />
        ) : inbox.error ? (
          <EmptyDeck
            title="The inbox could not be loaded"
            body={inbox.error.message}
            actionLabel="Retry"
            onAction={inbox.refetch}
          />
        ) : activeInboxItem ? (
          <PRDeck
            current={activeInboxItem}
            next={inbox.items[currentPRIndex + 1]}
            inboxMode={inboxMode}
            detail={detailQuery.data}
            detailPending={detailQuery.isPending}
            onOpenReview={openSelectedPR}
            onSnooze={saveForLater}
            onTogglePeek={togglePeek}
          />
        ) : inbox.hiddenCount > 0 ? (
          <EmptyDeck
            title="Everything is saved for later"
            body="Your inbox is empty because all visible pull requests were snoozed locally. Reset them to bring the deck back."
            actionLabel="Reset Later"
            onAction={clearSnoozed}
          />
        ) : (
          <EmptyDeck
            title="No pull requests in your inbox"
            body="Nothing is open across requested, assigned, or authored PRs right now."
            actionLabel="Refresh"
            onAction={inbox.refetch}
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
              actionLabel="Back to Inbox"
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
              actionLabel="Back to Inbox"
              onAction={closeReview}
            />
          ) : currentSegment && currentFile ? (
            <>
              <SegmentDeck
                segment={currentSegment}
                nextSegment={nextSegment}
                isFlipped={flippedSegmentIds.includes(currentSegment.id)}
                onFlip={toggleFlip}
                onAccept={() => recordDecision('accepted')}
                onConcern={() => recordDecision('has-concern', { blocking: true })}
                onComment={openSegmentComment}
                file={currentFile}
                threads={currentThreads}
                onLinePress={openInlineComment}
              />
            </>
          ) : (
            <EmptyDeck
              title="No segments were returned"
              body="The diff parsed correctly, but no mobile review cards were produced."
              actionLabel="Back to Inbox"
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
        mode={submitMode}
        event={reviewEvent}
        stats={stats}
        initialBody={reviewBody}
        reasonMessage={
          submitMode === 'read-only'
            ? formatReadOnlyReason(detailQuery.data?.capabilities.review.reason)
            : submitMode === 'full-review' && !canSubmitReview
              ? 'Formal review submission is limited for this pull request right now.'
            : submitMode === 'self-merge'
              ? 'This is your PR. Use segment review to sanity-check the change before merging.'
              : undefined
        }
        mergeBlockedMessage={formatMergeBlockedReasons(detailQuery.data?.capabilities.merge.blockedReasons ?? [])}
        mergeableLabel={
          detailQuery.data?.capabilities.merge.canMerge
            ? 'Mergeable'
            : detailQuery.data?.capabilities.merge.mergeable === 'CONFLICTING'
              ? 'Conflicts'
              : 'Blocked'
        }
        allowedMethods={allowedMergeMethods}
        selectedMethod={selectedMergeMethod}
        canMerge={detailQuery.data?.capabilities.merge.canMerge ?? false}
        canSubmitReview={canSubmitReview}
        isSubmittingReview={createReview.isPending}
        isSubmittingMerge={mergePullRequest.isPending}
        onClose={() => setMode('segment-deck')}
        onSubmitReview={submitReview}
        onMerge={mergePR}
        onPostComment={postComment}
        onCopyNotes={copyNotes}
        onOpenGitHub={openOnGitHub}
        onSelectMethod={setSelectedMergeMethod}
      />
    </View>
  );
}
