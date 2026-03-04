import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DiffHunkHeaderProps {
  header: string;
}

function DiffHunkHeaderComponent({ header }: DiffHunkHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        {header}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  text: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#3b82f6',
  },
});

export const DiffHunkHeader = memo(DiffHunkHeaderComponent);
