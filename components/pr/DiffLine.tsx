import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DiffLine as DiffLineType } from '@/services/diffParser';

interface DiffLineProps {
  line: DiffLineType;
}

const LINE_BG: Record<DiffLineType['type'], string> = {
  addition: '#dcfce7',
  deletion: '#fee2e2',
  context: 'transparent',
};

const LINE_BG_DARK: Record<DiffLineType['type'], string> = {
  addition: 'rgba(34, 197, 94, 0.15)',
  deletion: 'rgba(239, 68, 68, 0.15)',
  context: 'transparent',
};

const LINE_NUM_BG: Record<DiffLineType['type'], string> = {
  addition: '#bbf7d0',
  deletion: '#fecaca',
  context: 'transparent',
};

const LINE_NUM_BG_DARK: Record<DiffLineType['type'], string> = {
  addition: 'rgba(34, 197, 94, 0.25)',
  deletion: 'rgba(239, 68, 68, 0.25)',
  context: 'transparent',
};

function DiffLineComponent({ line }: DiffLineProps) {
  const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

  return (
    <View style={[styles.row, { backgroundColor: LINE_BG[line.type] }]}>
      <View style={[styles.lineNumCol, { backgroundColor: LINE_NUM_BG[line.type] }]}>
        <Text style={styles.lineNum}>
          {line.oldLineNumber ?? ''}
        </Text>
      </View>
      <View style={[styles.lineNumCol, { backgroundColor: LINE_NUM_BG[line.type] }]}>
        <Text style={styles.lineNum}>
          {line.newLineNumber ?? ''}
        </Text>
      </View>
      <Text style={styles.prefix}>{prefix}</Text>
      <Text style={styles.content} numberOfLines={1}>
        {line.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 22,
  },
  lineNumCol: {
    width: 40,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  lineNum: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
  prefix: {
    width: 16,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#6b7280',
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingRight: 8,
    alignSelf: 'center',
  },
});

export const DiffLine = memo(DiffLineComponent);
