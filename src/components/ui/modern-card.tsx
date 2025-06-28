'use client';

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  gradient?: string;
  onClick?: () => void;
  variant?: 'default' | 'gradient' | 'glass';
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ children, className, enableTilt = true, gradient, onClick, variant = 'default' }, ref) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const animationHandlers = useMemo(() => {
      if (!enableTilt) return null;

      let rafId: number | null = null;

      const updateCardTransform = (offsetX: number, offsetY: number, card: HTMLElement, wrap: HTMLElement) => {
        const width = card.clientWidth;
        const height = card.clientHeight;

        const percentX = Math.min(Math.max((100 / width) * offsetX, 0), 100);
        const percentY = Math.min(Math.max((100 / height) * offsetY, 0), 100);

        const centerX = percentX - 50;
        const centerY = percentY - 50;

        const properties = {
          "--pointer-x": `${percentX}%`,
          "--pointer-y": `${percentY}%`,
          "--background-x": `${50 + (percentX - 50) * 0.3}%`,
          "--background-y": `${50 + (percentY - 50) * 0.3}%`,
          "--pointer-from-center": `${Math.min(Math.hypot(percentY - 50, percentX - 50) / 50, 1)}`,
          "--pointer-from-top": `${percentY / 100}`,
          "--pointer-from-left": `${percentX / 100}`,
          "--rotate-x": `${-(centerX / 8)}deg`,
          "--rotate-y": `${centerY / 6}deg`,
        };

        Object.entries(properties).forEach(([property, value]) => {
          wrap.style.setProperty(property, value);
        });
      };

      const createSmoothAnimation = (duration: number, startX: number, startY: number, card: HTMLElement, wrap: HTMLElement) => {
        const startTime = performance.now();
        const targetX = wrap.clientWidth / 2;
        const targetY = wrap.clientHeight / 2;

        const animationLoop = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(Math.max(elapsed / duration, 0), 1);
          const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const currentX = startX + (targetX - startX) * easedProgress;
          const currentY = startY + (targetY - startY) * easedProgress;

          updateCardTransform(currentX, currentY, card, wrap);

          if (progress < 1) {
            rafId = requestAnimationFrame(animationLoop);
          }
        };

        rafId = requestAnimationFrame(animationLoop);
      };

      return {
        updateCardTransform,
        createSmoothAnimation,
        cancelAnimation: () => {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        },
      };
    }, [enableTilt]);

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        const card = cardRef.current;
        const wrap = wrapRef.current;

        if (!card || !wrap || !animationHandlers) return;

        const rect = card.getBoundingClientRect();
        animationHandlers.updateCardTransform(
          event.clientX - rect.left,
          event.clientY - rect.top,
          card,
          wrap
        );
      },
      [animationHandlers]
    );

    const handlePointerEnter = useCallback(() => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      animationHandlers.cancelAnimation();
      wrap.classList.add("active");
      card.classList.add("active");
    }, [animationHandlers]);

    const handlePointerLeave = useCallback(
      (event: PointerEvent) => {
        const card = cardRef.current;
        const wrap = wrapRef.current;

        if (!card || !wrap || !animationHandlers) return;

        animationHandlers.createSmoothAnimation(600, event.offsetX, event.offsetY, card, wrap);
        wrap.classList.remove("active");
        card.classList.remove("active");
      },
      [animationHandlers]
    );

    useEffect(() => {
      if (!enableTilt || !animationHandlers) return;

      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap) return;

      const pointerMoveHandler = handlePointerMove;
      const pointerEnterHandler = handlePointerEnter;
      const pointerLeaveHandler = handlePointerLeave;

      card.addEventListener("pointerenter", pointerEnterHandler);
      card.addEventListener("pointermove", pointerMoveHandler);
      card.addEventListener("pointerleave", pointerLeaveHandler);

      const initialX = wrap.clientWidth - 70;
      const initialY = 60;

      animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
      animationHandlers.createSmoothAnimation(1500, initialX, initialY, card, wrap);

      return () => {
        card.removeEventListener("pointerenter", pointerEnterHandler);
        card.removeEventListener("pointermove", pointerMoveHandler);
        card.removeEventListener("pointerleave", pointerLeaveHandler);
        animationHandlers.cancelAnimation();
      };
    }, [enableTilt, animationHandlers, handlePointerMove, handlePointerEnter, handlePointerLeave]);

    const cardStyle = useMemo(() => ({
      "--gradient": gradient || "linear-gradient(145deg, rgba(96, 73, 110, 0.55) 0%, rgba(113, 196, 255, 0.27) 100%)",
    } as React.CSSProperties), [gradient]);

    return (
      <div
        ref={wrapRef}
        className={cn(
          "modern-card-wrapper perspective-500 transform-gpu relative touch-none",
          className
        )}
        style={cardStyle}
      >
        <div
          ref={cardRef}
          className={cn(
            "modern-card relative rounded-[30px] transition-transform duration-1000 ease-out overflow-hidden",
            "bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm",
            "border border-white/10 shadow-2xl",
            "hover:transition-none active:transition-none",
            variant === 'glass' && "bg-white/5 backdrop-blur-xl border-white/20",
            variant === 'gradient' && "bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-cyan-900/80"
          )}
          onClick={onClick}
        >
          <div className="modern-inside absolute inset-[1px] rounded-[29px] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm" />
          <div className="modern-shine absolute inset-0 rounded-[30px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="modern-glare absolute inset-0 rounded-[30px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative z-10 p-6">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

ModernCard.displayName = "ModernCard";

export { ModernCard }; 