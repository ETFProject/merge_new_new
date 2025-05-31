'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './card';
import { cn } from "@/lib/utils";

interface ClientCardProps extends React.ComponentProps<typeof Card> {
  appear?: boolean;
  hover?: boolean;
  effect3d?: boolean;
}

export function ClientCard({ appear, hover, effect3d, className, ...props }: ClientCardProps) {
  return (
    <Card 
      className={cn(
        className,
        appear && 'card-appear',
        hover && 'card-hover',
        effect3d && 'card-3d'
      )}
      {...props}
    />
  );
}

export { CardContent, CardDescription, CardHeader, CardTitle, CardFooter }; 