import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/utils';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  delay?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * Wrapper component to reveal content when it appears in the viewport.
 */
export function ScrollReveal({
  as: Component = 'div',
  children,
  className,
  delay = 0,
  once = true,
  threshold,
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLElement>({ once, threshold });
  const inlineStyle: CSSProperties = {
    transitionDelay: `${delay}ms`,
    ...(style as CSSProperties | undefined)
  };

  return (
    <Component
      ref={ref as never}
      className={cn('scroll-reveal opacity-0 translate-y-6', className)}
      style={inlineStyle}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default ScrollReveal;
