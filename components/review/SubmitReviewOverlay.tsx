import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import type { MergeMethod, ReviewMode } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface SubmitReviewOverlayProps {
  open: boolean;
  mode: ReviewMode;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  stats: {
    accepted: number;
    concerns: number;
    comments: number;
    skipped: number;
  };
  initialBody: string;
  reasonMessage?: string;
  mergeBlockedMessage?: string;
  mergeableLabel?: string;
  allowedMethods: MergeMethod[];
  selectedMethod: MergeMethod;
  canMerge: boolean;
  canSubmitReview: boolean;
  isSubmittingReview: boolean;
  isSubmittingMerge: boolean;
  onClose: () => void;
  onSubmitReview: (body: string) => void;
  onMerge: (body: string) => void;
  onPostComment: (body: string) => void;
  onCopyNotes: (body: string) => void;
  onOpenGitHub: () => void;
  onSelectMethod: (method: MergeMethod) => void;
}

const METHOD_LABELS: Record<MergeMethod, string> = {
  merge: 'Merge commit',
  squash: 'Squash',
  rebase: 'Rebase',
};

const MODE_COPY: Record<
  ReviewMode,
  { eyebrow: string; title: string; cta: string; placeholder: string }
> = {
  'full-review': {
    eyebrow: 'Submit Review',
    title: 'Formal review',
    cta: 'Submit Review',
    placeholder: 'Optional review summary...',
  },
  'read-only': {
    eyebrow: 'Read-only review',
    title: 'Notes only',
    cta: 'Copy Notes',
    placeholder: 'Private review notes...',
  },
  'self-merge': {
    eyebrow: 'Self-review',
    title: 'Ready to merge',
    cta: 'Merge PR',
    placeholder: 'Optional merge note or comment...',
  },
};

export function SubmitReviewOverlay({
  open,
  mode,
  event,
  stats,
  initialBody,
  reasonMessage,
  mergeBlockedMessage,
  mergeableLabel,
  allowedMethods,
  selectedMethod,
  canMerge,
  canSubmitReview,
  isSubmittingReview,
  isSubmittingMerge,
  onClose,
  onSubmitReview,
  onMerge,
  onPostComment,
  onCopyNotes,
  onOpenGitHub,
  onSelectMethod,
}: SubmitReviewOverlayProps) {
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody, mode]);

  if (!open) return null;

  const copy = MODE_COPY[mode];

  return (
    <View className="absolute inset-0 items-center justify-end bg-black/40 px-4 pb-6">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <BlurView
        intensity={45}
        tint="default"
        className="w-full overflow-hidden rounded-[32px] border border-border/80 bg-card/90 p-5"
      >
        <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{copy.eyebrow}</Text>
        <Text variant="h3" className="mt-2 border-b-0 pb-0 text-left text-[28px]">
          {mode === 'full-review' ? event.replace('_', ' ') : copy.title}
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-secondary px-3 py-2">
            <Text className="text-xs">Accepted {stats.accepted}</Text>
          </View>
          <View className="rounded-full bg-secondary px-3 py-2">
            <Text className="text-xs">Concerns {stats.concerns}</Text>
          </View>
          <View className="rounded-full bg-secondary px-3 py-2">
            <Text className="text-xs">Comments {stats.comments}</Text>
          </View>
          <View className="rounded-full bg-secondary px-3 py-2">
            <Text className="text-xs">Skipped {stats.skipped}</Text>
          </View>
        </View>

        {reasonMessage ? (
          <View className="mt-4 rounded-[22px] border border-border bg-backgroundAlt/80 px-4 py-4">
            <Text className="text-sm leading-6 text-foreground/85">{reasonMessage}</Text>
          </View>
        ) : null}

        {mode === 'self-merge' ? (
          <View className="mt-4 gap-4">
            <View>
              <Text className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Merge readiness
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Badge variant={canMerge ? 'secondary' : 'outline'}>
                  <Text className="text-xs">{mergeableLabel ?? (canMerge ? 'Ready' : 'Blocked')}</Text>
                </Badge>
              </View>
              {mergeBlockedMessage ? (
                <Text className="mt-3 text-sm leading-6 text-destructive">{mergeBlockedMessage}</Text>
              ) : null}
            </View>

            <View>
              <Text className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Merge method
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {allowedMethods.map((method) => (
                  <Pressable key={method} onPress={() => onSelectMethod(method)}>
                    <Badge variant={selectedMethod === method ? 'secondary' : 'outline'}>
                      <Text className="text-xs">{METHOD_LABELS[method]}</Text>
                    </Badge>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        <TextInput
          multiline
          value={body}
          onChangeText={setBody}
          placeholder={copy.placeholder}
          placeholderTextColor="#928374"
          className="mt-4 min-h-[140px] rounded-[22px] border border-border bg-background px-4 py-4 text-base text-foreground"
          style={{ textAlignVertical: 'top', fontFamily: 'InstrumentSans' }}
        />

        <View className="mt-4 gap-3">
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl" onPress={onClose}>
              <Text>Close</Text>
            </Button>

            {mode === 'full-review' ? (
              <Button
                className="flex-1 rounded-2xl"
                disabled={!canSubmitReview || isSubmittingReview}
                onPress={() => onSubmitReview(body)}
              >
                <Text>{isSubmittingReview ? 'Submitting...' : copy.cta}</Text>
              </Button>
            ) : mode === 'read-only' ? (
              <Button className="flex-1 rounded-2xl" onPress={() => onCopyNotes(body)}>
                <Text>{copy.cta}</Text>
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-2xl"
                disabled={!canMerge || isSubmittingMerge}
                onPress={() => onMerge(body)}
              >
                <Text>{isSubmittingMerge ? 'Merging...' : copy.cta}</Text>
              </Button>
            )}
          </View>

          {mode === 'self-merge' ? (
            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1 rounded-2xl"
                disabled={isSubmittingReview}
                onPress={() => onPostComment(body)}
              >
                <Text>{isSubmittingReview ? 'Posting...' : 'Post Comment'}</Text>
              </Button>
              <Button variant="ghost" className="flex-1 rounded-2xl" onPress={onOpenGitHub}>
                <Text>Open on GitHub</Text>
              </Button>
            </View>
          ) : mode === 'read-only' ? (
            <Button variant="ghost" className="rounded-2xl" onPress={onOpenGitHub}>
              <Text>Open on GitHub</Text>
            </Button>
          ) : null}
        </View>
      </BlurView>
    </View>
  );
}
