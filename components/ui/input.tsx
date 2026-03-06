import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

const Input = React.forwardRef<TextInput, TextInputProps>(
  ({ className, placeholderClassName, style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'h-12 rounded-2xl border border-input bg-background px-4 text-base text-foreground',
          Platform.select({
            web: 'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          }),
          className
        )}
        placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
        style={[{ fontFamily: 'InstrumentSans' }, style]}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
