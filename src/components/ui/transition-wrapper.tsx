'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type TransitionType = 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'card-appear' | 'zoom-in';

interface TransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: TransitionType;
  delay?: number; // In milliseconds
  duration?: number; // In milliseconds
  show?: boolean;
  as?: React.ElementType;
}

/**
 * A wrapper component that applies view transitions to its children
 */
export function TransitionWrapper({
  children,
  className,
  transitionType = 'fade-in',
  delay = 0,
  duration = 300,
  show = true,
  as: Component = 'div',
}: TransitionWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all overflow-hidden';
    const hiddenStateClasses = !mounted || !show ? 'opacity-0 ' : 'opacity-100 ';
    const durationClass = `duration-${duration}`;
    const delayClass = delay > 0 ? `delay-${delay}` : '';

    let transformClasses = '';
    let additionalClasses = '';

    switch (transitionType) {
      case 'fade-in':
        additionalClasses = hiddenStateClasses;
        break;
      case 'slide-up':
        transformClasses = !mounted || !show ? 'translate-y-5 ' : 'translate-y-0 ';
        additionalClasses = hiddenStateClasses;
        break;
      case 'slide-down':
        transformClasses = !mounted || !show ? 'translate-y-[-5px] ' : 'translate-y-0 ';
        additionalClasses = hiddenStateClasses;
        break;
      case 'slide-left':
        transformClasses = !mounted || !show ? 'translate-x-5 ' : 'translate-x-0 ';
        additionalClasses = hiddenStateClasses;
        break;
      case 'slide-right':
        transformClasses = !mounted || !show ? 'translate-x-[-5px] ' : 'translate-x-0 ';
        additionalClasses = hiddenStateClasses;
        break;
      case 'card-appear':
        transformClasses = !mounted || !show ? 'scale-95 ' : 'scale-100 ';
        additionalClasses = hiddenStateClasses;
        break;
      case 'zoom-in':
        transformClasses = !mounted || !show ? 'scale-90 ' : 'scale-100 ';
        additionalClasses = hiddenStateClasses;
        break;
      default:
        additionalClasses = hiddenStateClasses;
    }

    return cn(
      baseClasses,
      durationClass,
      delayClass,
      transformClasses,
      additionalClasses
    );
  };

  return (
    <Component className={cn(getTransitionClasses(), className)}>
      {children}
    </Component>
  );
} 