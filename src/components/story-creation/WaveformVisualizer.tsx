import { useRef, useEffect } from 'react';
import { FABLINO_COLORS } from '@/constants/design-tokens';

interface WaveformVisualizerProps {
  analyser: AnalyserNode;
  isRecording: boolean;
}

const MAX_BARS = 35;
const CAPTURE_INTERVAL_MS = 80;
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 36;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_RADIUS = 1.5;
const MIN_BAR_HEIGHT = 2;

const WaveformVisualizer = ({ analyser, isRecording }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const lastCaptureRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording || !analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(draw);

      // Capture amplitude at interval
      if (timestamp - lastCaptureRef.current >= CAPTURE_INTERVAL_MS) {
        lastCaptureRef.current = timestamp;

        // Calculate RMS amplitude from time domain data
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const amplitude = Math.min(rms * 3, 1); // Scale up, clamp to 1

        barsRef.current.push(amplitude);
        if (barsRef.current.length > MAX_BARS) {
          barsRef.current.shift();
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const bars = barsRef.current;
      const centerY = CANVAS_HEIGHT / 2;
      const totalBarWidth = BAR_WIDTH + BAR_GAP;

      // Draw bars from right to left (newest on right)
      for (let i = 0; i < bars.length; i++) {
        const amp = bars[i];
        const barHeight = Math.max(MIN_BAR_HEIGHT, amp * (CANVAS_HEIGHT - 4));
        const x = CANVAS_WIDTH - (bars.length - i) * totalBarWidth;
        const y = centerY - barHeight / 2;
        const opacity = 0.5 + amp * 0.5;

        ctx.fillStyle = FABLINO_COLORS.primary;
        ctx.globalAlpha = opacity;

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, BAR_RADIUS);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    // Reset bars on start
    barsRef.current = [];
    lastCaptureRef.current = 0;
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    />
  );
};

export default WaveformVisualizer;
