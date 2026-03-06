import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

interface CommentOverlayProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (body: string) => void;
}

export function CommentOverlay({ open, title, onClose, onSubmit }: CommentOverlayProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) {
      setValue('');
    }
  }, [open, title]);

  if (!open) return null;

  return (
    <View className="absolute inset-0 items-center justify-end bg-black/35 px-4 pb-6">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <BlurView intensity={45} tint="default" className="w-full overflow-hidden rounded-[30px] border border-border/80 bg-card/90 p-5">
        <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Comment</Text>
        <Text className="mt-2 text-base font-semibold text-foreground">{title}</Text>
        <TextInput
          multiline
          placeholder="Leave a note for this review..."
          placeholderTextColor="#928374"
          value={value}
          onChangeText={setValue}
          className="mt-4 min-h-[140px] rounded-[22px] border border-border bg-background px-4 py-4 text-base text-foreground"
          style={{ textAlignVertical: 'top', fontFamily: 'InstrumentSans' }}
        />
        <View className="mt-4 flex-row gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button
            className="flex-1 rounded-2xl"
            onPress={() => {
              if (!value.trim()) return;
              onSubmit(value.trim());
              setValue('');
            }}
          >
            <Text>Save Comment</Text>
          </Button>
        </View>
      </BlurView>
    </View>
  );
}
