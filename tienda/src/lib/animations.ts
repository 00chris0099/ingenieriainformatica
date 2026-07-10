export interface AnimationConfig {
  type: string;
  trigger: 'load' | 'scroll';
  duration: number;
  delay: number;
}

export function getAnimationStyles(config: AnimationConfig): React.CSSProperties {
  if (!config || config.type === 'none') return {};

  const base: React.CSSProperties = {
    transition: `all ${config.duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${config.delay}ms`,
  };

  switch (config.type) {
    case 'fadeIn':
      return { ...base, opacity: 1 };
    case 'slideUp':
      return { ...base, opacity: 1, transform: 'translateY(0)' };
    case 'slideDown':
      return { ...base, opacity: 1, transform: 'translateY(0)' };
    case 'slideLeft':
      return { ...base, opacity: 1, transform: 'translateX(0)' };
    case 'slideRight':
      return { ...base, opacity: 1, transform: 'translateX(0)' };
    case 'zoomIn':
      return { ...base, opacity: 1, transform: 'scale(1)' };
    case 'zoomOut':
      return { ...base, opacity: 1, transform: 'scale(1)' };
    default:
      return {};
  }
}

export function getInitialStyles(config: AnimationConfig): React.CSSProperties {
  if (!config || config.type === 'none') return {};

  switch (config.type) {
    case 'fadeIn':
      return { opacity: 0 };
    case 'slideUp':
      return { opacity: 0, transform: 'translateY(30px)' };
    case 'slideDown':
      return { opacity: 0, transform: 'translateY(-30px)' };
    case 'slideLeft':
      return { opacity: 0, transform: 'translateX(30px)' };
    case 'slideRight':
      return { opacity: 0, transform: 'translateX(-30px)' };
    case 'zoomIn':
      return { opacity: 0, transform: 'scale(0.9)' };
    case 'zoomOut':
      return { opacity: 0, transform: 'scale(1.1)' };
    default:
      return {};
  }
}

export function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const animationType = element.dataset.animationType;
          const duration = element.dataset.animationDuration || '500';
          const delay = element.dataset.animationDelay || '0';

          if (animationType && animationType !== 'none') {
            element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`;
            element.classList.add('animate-in');
          }

          observer.unobserve(element);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('[data-animation-type]').forEach((el) => {
    observer.observe(el);
  });

  return () => observer.disconnect();
}
