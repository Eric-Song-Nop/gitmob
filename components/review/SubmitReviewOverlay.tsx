import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

interface SubmitReviewOverlayProps {
  open: boolean;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  stats: {
    accepted: number;
    concerns: number;
    comments: number;
    skipped: number;
  };
  initialBody: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (body: string) => void;
}

export function SubmitReviewOverlay({
  open,
  event,
  stats,
  initialBody,
  isSubmitting,
  onClose,
  onSubmit,
}: SubmitReviewOverlayProps) {
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  if (!open) return null;

  return (
    <View className="absolute inset-0 items-center justify-end bg-black/40 px-4 pb-6">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <BlurView intensity={45} tint="default" className="w-full overflow-hidden rounded-[32px] border border-border/80 bg-card/90 p-5">
        <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Submit Review</Text>
        <Text variant="h3" className="mt-2 border-b-0 pb-0 text-left text-[28px]">{event.replace('_', ' ')}</Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-secondary px-3 py-2"><Text className="text-xs">Accepted {stats.accepted}</Text></View>
          <View className="rounded-full bg-secondary px-3 py-2"><Text className="text-xs">Concerns {stats.concerns}</Text></View>
          <View className="rounded-full bg-secondary px-3 py-2"><Text className="text-xs">Comments {stats.comments}</Text></View>
          <View className="rounded-full bg-secondary px-3 py-2"><Text className="text-xs">Skipped {stats.skipped}</Text></View>
        </View>

        <TextInput
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="Optional review summary..."
          placeholderTextColor="#928374"
          className="mt-4 min-h-[140px] rounded-[22px] border border-border bg-background px-4 py-4 text-base text-foreground"
          style={{ textAlignVertical: 'top', fontFamily: 'InstrumentSans' }}
        />

        <View className="mt-4 flex-row gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onPress={onClose}>
            <Text>Close</Text>
          </Button>
          <Button className="flex-1 rounded-2xl" disabled={isSubmitting} onPress={() => onSubmit(body)}>
            <Text>{isSubmitting ? 'Submitting...' : 'Submit Review'}</Text>
          </Button>
        </View>
      </BlurView>
    </View>
  );
}
