import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react-native';
import type { StatusCheckRollup, StatusCheck } from '@/api/types';
import { View, Pressable, Linking } from 'react-native';

interface CIChecksProps {
  rollup: StatusCheckRollup | null;
}

const STATE_ICON = {
  SUCCESS: { icon: CheckCircle, className: 'text-green-600' },
  FAILURE: { icon: XCircle, className: 'text-red-600' },
  ERROR: { icon: XCircle, className: 'text-red-600' },
  PENDING: { icon: Clock, className: 'text-yellow-600' },
  EXPECTED: { icon: AlertCircle, className: 'text-muted-foreground' },
} as const;

function CIChecks({ rollup }: CIChecksProps) {
  if (!rollup || rollup.contexts.length === 0) {
    return (
      <View className="gap-2 px-4 py-3">
        <Text variant="small" className="font-semibold">CI Checks</Text>
        <Text variant="small" className="text-muted-foreground">No checks</Text>
      </View>
    );
  }

  const successCount = rollup.contexts.filter((c) => c.state === 'SUCCESS').length;
  const total = rollup.contexts.length;

  return (
    <View className="gap-2 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text variant="small" className="font-semibold">CI Checks</Text>
        <Text variant="small" className="text-muted-foreground">
          {successCount}/{total} passed
        </Text>
      </View>
      <View className="gap-1">
        {rollup.contexts.map((check) => (
          <CheckItem key={check.context} check={check} />
        ))}
      </View>
    </View>
  );
}

function CheckItem({ check }: { check: StatusCheck }) {
  const config = STATE_ICON[check.state] ?? STATE_ICON.PENDING;

  const content = (
    <View className="flex-row items-center gap-2 rounded-md px-2 py-1.5">
      <Icon as={config.icon} className={`h-4 w-4 ${config.className}`} />
      <Text variant="small" className="flex-1" numberOfLines={1}>
        {check.context}
      </Text>
      {check.description && (
        <Text variant="small" className="text-muted-foreground" numberOfLines={1}>
          {check.description}
        </Text>
      )}
    </View>
  );

  if (check.targetUrl) {
    return (
      <Pressable onPress={() => Linking.openURL(check.targetUrl!)}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export { CIChecks };
