import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import type { BadgeProps } from '@/components/ui/badge';

type PRState = 'OPEN' | 'CLOSED' | 'MERGED';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  state: PRState;
  isDraft?: boolean;
}

const STATE_CONFIG: Record<PRState, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'border-transparent bg-green-600' },
  CLOSED: { label: 'Closed', className: 'border-transparent bg-red-600' },
  MERGED: { label: 'Merged', className: 'border-transparent bg-purple-600' },
};

function StatusBadge({ state, isDraft, ...props }: StatusBadgeProps) {
  if (isDraft) {
    return (
      <Badge variant="secondary" {...props}>
        <Text className="text-xs font-semibold text-secondary-foreground">Draft</Text>
      </Badge>
    );
  }

  const config = STATE_CONFIG[state];
  return (
    <Badge className={config.className} {...props}>
      <Text className="text-xs font-semibold text-white">{config.label}</Text>
    </Badge>
  );
}

export { StatusBadge };
