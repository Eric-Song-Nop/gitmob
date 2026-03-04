import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import type { PRFile } from '@/api/types';

interface FileStatusBadgeProps {
  status: PRFile['status'];
}

const STATUS_CONFIG: Record<PRFile['status'], { label: string; className: string }> = {
  added: { label: 'A', className: 'bg-green-600' },
  removed: { label: 'D', className: 'bg-red-600' },
  modified: { label: 'M', className: 'bg-yellow-600' },
  renamed: { label: 'R', className: 'bg-blue-600' },
  copied: { label: 'C', className: 'bg-blue-600' },
  changed: { label: 'M', className: 'bg-yellow-600' },
  unchanged: { label: 'U', className: 'bg-muted' },
};

function FileStatusBadge({ status }: FileStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.changed;

  return (
    <View className={`h-5 w-5 items-center justify-center rounded ${config.className}`}>
      <Text className="text-[10px] font-bold text-white">{config.label}</Text>
    </View>
  );
}

export { FileStatusBadge };
