import { useCallback, useEffect, useRef, useState } from 'react';

interface SpectrumColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { h: 152, s: 1, v: 1 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s, v };
}

const PRESET_SWATCHES = [
  '#00ff88', '#00e5ff', '#ff3b30', '#ffb800', '#af52de',
  '#ff2d55', '#c7ff4a', '#007aff', '#ff6b00', '#00ffcc',
  '#ff00aa', '#7000ff', '#30d158', '#ffd60a', '#5856d6',
  '#ff453a', '#64d2ff', '#bf5af2', '#ff9f0a', '#32ade6',
];

export function SpectrumColorPicker({ value, onChange }: SpectrumColorPickerProps) {
  const initialHsv = hexToHsv(value || '#00ff88');
  const [hsv, setHsv] = useState(initialHsv);
  const satBoxRef = useRef<HTMLDivElement | null>(null);
  const hueBarRef = useRef<HTMLDivElement | null>(null);
  const draggingSat = useRef(false);
  const draggingHue = useRef(false);

  useEffect(() => {
    const parsed = hexToHsv(value);
    setHsv(parsed);
  }, [value]);

  const updateSatVal = useCallback(
    (clientX: number, clientY: number) => {
      const box = satBoxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      setHsv((prev) => {
        const next = { ...prev, s, v };
        onChange(hsvToHex(next.h, next.s, next.v));
        return next;
      });
    },
    [onChange],
  );

  const updateHue = useCallback(
    (clientX: number) => {
      const bar = hueBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const h = Math.round(ratio * 360);
      setHsv((prev) => {
        const next = { ...prev, h };
        onChange(hsvToHex(next.h, next.s, next.v));
        return next;
      });
    },
    [onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingSat.current && !draggingHue.current) return;
      const point = 'touches' in e ? e.touches[0] : e;
      if (!point) return;
      if (draggingSat.current) {
        updateSatVal(point.clientX, point.clientY);
      } else if (draggingHue.current) {
        updateHue(point.clientX);
      }
    };
    const onUp = () => {
      draggingSat.current = false;
      draggingHue.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updateSatVal, updateHue]);

  const pureHueHex = hsvToHex(hsv.h, 1, 1);

  return (
    <div className="spectrum-picker-container">
      {/* 2D Saturation / Brightness Canvas Box (Computer-style mouse/finger picker) */}
      <div
        ref={satBoxRef}
        className="spectrum-sat-box"
        style={{ backgroundColor: pureHueHex }}
        onMouseDown={(e) => {
          draggingSat.current = true;
          updateSatVal(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          draggingSat.current = true;
          const t = e.touches[0];
          if (t) updateSatVal(t.clientX, t.clientY);
        }}
        role="slider"
        aria-label="Rang spektri"
        aria-valuenow={Math.round(hsv.s * 100)}
      >
        <div className="spectrum-sat-white" />
        <div className="spectrum-sat-black" />
        <div
          className="spectrum-cursor"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: value,
          }}
        />
      </div>

      {/* Rainbow Hue Slider Bar */}
      <div
        ref={hueBarRef}
        className="spectrum-hue-bar"
        onMouseDown={(e) => {
          draggingHue.current = true;
          updateHue(e.clientX);
        }}
        onTouchStart={(e) => {
          draggingHue.current = true;
          const t = e.touches[0];
          if (t) updateHue(t.clientX);
        }}
        role="slider"
        aria-label="Rang ohangi (Hue)"
        aria-valuenow={hsv.h}
      >
        <div
          className="spectrum-hue-thumb"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: pureHueHex,
          }}
        />
      </div>

      {/* Selected Color Preview + Hex Code */}
      <div className="spectrum-preview-row">
        <div className="spectrum-preview-badge">
          <span className="spectrum-preview-dot" style={{ backgroundColor: value }} />
          <span className="spectrum-preview-hex">{value.toUpperCase()}</span>
        </div>
        <span className="spectrum-preview-hint">👆 Spektrdan o&apos;zingiz xohlagan rangni tanlang</span>
      </div>

      {/* Quick 20 Neon Swatches */}
      <div className="spectrum-swatches-grid">
        {PRESET_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className={`spectrum-swatch-btn ${value.toLowerCase() === c.toLowerCase() ? 'selected' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
