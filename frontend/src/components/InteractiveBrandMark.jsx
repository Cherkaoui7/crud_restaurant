import { useRef } from 'react';
import { ChefHat, Sparkles } from 'lucide-react';

export function InteractiveBrandMark({
  caption = 'Interactive 3D brand mark',
  compact = false,
  label = 'Resto Signal',
  showMeta = true,
}) {
  const rootRef = useRef(null);

  function handlePointerMove(event) {
    const element = rootRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 24;
    const rotateX = (0.5 - py) * 20;

    element.style.setProperty('--brand-rotate-x', `${rotateX.toFixed(2)}deg`);
    element.style.setProperty('--brand-rotate-y', `${rotateY.toFixed(2)}deg`);
    element.style.setProperty('--brand-glow-x', `${(px * 100).toFixed(2)}%`);
    element.style.setProperty('--brand-glow-y', `${(py * 100).toFixed(2)}%`);
  }

  function handlePointerLeave() {
    const element = rootRef.current;

    if (!element) {
      return;
    }

    element.style.setProperty('--brand-rotate-x', '0deg');
    element.style.setProperty('--brand-rotate-y', '0deg');
    element.style.setProperty('--brand-glow-x', '50%');
    element.style.setProperty('--brand-glow-y', '50%');
  }

  return (
    <div
      ref={rootRef}
      className={`brand-motion ${compact ? 'brand-motion--compact' : ''}`}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <div className="brand-motion__stage">
        <div className="brand-motion__halo" />
        <div className="brand-motion__spin">
          <div className="brand-motion__plate">
            <span className="brand-motion__icon">
              <ChefHat size={compact ? 18 : 24} />
            </span>
            <span className="brand-motion__spark">
              <Sparkles size={compact ? 14 : 18} />
            </span>
            <div className="brand-motion__layers">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      {showMeta ? (
        <div className="brand-motion__meta">
          <strong>{label}</strong>
          <small>{caption}</small>
        </div>
      ) : null}
    </div>
  );
}
