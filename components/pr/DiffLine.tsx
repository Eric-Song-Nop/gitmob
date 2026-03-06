import { memo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { DiffLine as DiffLineType } from '@/services/diffParser';

interface DiffLineProps {
  line: DiffLineType;
  onPress?: () => void;
}

const LINE_BG_LIGHT: Record<DiffLineType['type'], string> = {
  addition: '#ebf3c8',
  deletion: '#f4d7d2',
  context: 'transparent',
};

const LINE_BG_DARK: Record<DiffLineType['type'], string> = {
  addition: 'rgba(184, 187, 38, 0.15)',
  deletion: 'rgba(251, 73, 52, 0.16)',
  context: 'transparent',
};

const LINE_NUM_BG_LIGHT: Record<DiffLineType['type'], string> = {
  addition: '#dfe8b2',
  deletion: '#edd0cb',
  context: 'transparent',
};

const LINE_NUM_BG_DARK: Record<DiffLineType['type'], string> = {
  addition: 'rgba(184, 187, 38, 0.22)',
  deletion: 'rgba(251, 73, 52, 0.22)',
  context: 'transparent',
};

function DiffLineComponent({ line, onPress }: DiffLineProps) {
  const { colorScheme } = useColorScheme();
  const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
  const rowBg = colorScheme === 'dark' ? LINE_BG_DARK[line.type] : LINE_BG_LIGHT[line.type];
  const numBg =
    colorScheme === 'dark' ? LINE_NUM_BG_DARK[line.type] : LINE_NUM_BG_LIGHT[line.type];
  const textColor = colorScheme === 'dark' ? '#ebdbb2' : '#3c3836';
  const subtleColor = colorScheme === 'dark' ? '#a89984' : '#7c6f64';

  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <View style={[styles.row, { backgroundColor: rowBg }]}>
        <View style={[styles.lineNumCol, { backgroundColor: numBg }]}>
          <Text style={[styles.lineNum, { color: subtleColor }]}>{line.oldLineNumber ?? ''}</Text>
        </View>
        <View style={[styles.lineNumCol, { backgroundColor: numBg }]}>
          <Text style={[styles.lineNum, { color: subtleColor }]}>{line.newLineNumber ?? ''}</Text>
        </View>
        <Text style={[styles.prefix, { color: subtleColor }]}>{prefix}</Text>
        <Text style={[styles.content, { color: textColor }]} numberOfLines={1}>
          {line.content}
        </Text>
      </View>
    </Pressable>
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
    fontFamily: 'JetBrainsMono',
  },
  prefix: {
    width: 16,
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    textAlign: 'center',
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    paddingRight: 8,
    alignSelf: 'center',
  },
});

export const DiffLine = memo(DiffLineComponent);
