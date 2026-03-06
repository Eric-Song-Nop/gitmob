import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'rounded-[28px] border border-border bg-card shadow-sm shadow-foreground/10',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

function CardTitle({ className, children, ...props }: ViewProps) {
  return (
    <TextClassContext.Provider value={cn('text-2xl font-semibold leading-none tracking-tight text-card-foreground', className)}>
      <View {...props}>{children}</View>
    </TextClassContext.Provider>
  );
}

function CardDescription({ className, children, ...props }: ViewProps) {
  return (
    <TextClassContext.Provider value={cn('text-sm text-muted-foreground', className)}>
      <View {...props}>{children}</View>
    </TextClassContext.Provider>
  );
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('flex-row items-center p-6 pt-0', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
