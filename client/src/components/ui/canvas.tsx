import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from './button';
import { Slider } from './slider';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Eraser, Pen, Save, Trash2, Undo, Redo, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CanvasRef {
  clearCanvas: () => void;
  getCanvasData: () => string;
  setCanvasData: (data: string) => void;
  undo: () => void;
  redo: () => void;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  timestamp: number;
}

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onStrokeComplete?: (stroke: Stroke) => void;
  onCanvasChange?: (canvasData: string) => void;
  disabled?: boolean;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  width = 800,
  height = 600,
  className,
  onStrokeComplete,
  onCanvasChange,
  disabled = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState('#000000');

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStrokes([]);
      setUndoStack([]);
      setRedoStack([]);
      onCanvasChange?.('');
    },
    getCanvasData: () => {
      const canvas = canvasRef.current;
      return canvas?.toDataURL() || '';
    },
    setCanvasData: (data: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !data) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = data;
    },
    undo: () => {
      if (strokes.length > 0) {
        const newStrokes = [...strokes];
        const lastStroke = newStrokes.pop();
        
        if (lastStroke) {
          setRedoStack(prev => [...prev, [lastStroke]]);
          setStrokes(newStrokes);
          redrawCanvas(newStrokes);
        }
      }
    },
    redo: () => {
      if (redoStack.length > 0) {
        const newRedoStack = [...redoStack];
        const strokesToRedo = newRedoStack.pop();
        
        if (strokesToRedo) {
          const newStrokes = [...strokes, ...strokesToRedo];
          setStrokes(newStrokes);
          setRedoStack(newRedoStack);
          redrawCanvas(newStrokes);
        }
      }
    },
  }));

  const redrawCanvas = (strokesToDraw: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokesToDraw.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  };

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        pressure: (touch as any).force || 0.5,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: 0.5,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    setRedoStack([]); // Clear redo stack when starting new stroke
    
    const pos = getEventPos(e);
    setCurrentStroke([pos]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const pos = getEventPos(e);
    
    setCurrentStroke(prev => [...prev, pos]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : strokeColor;
    ctx.lineWidth = tool === 'eraser' ? strokeWidth * 2 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || disabled) return;
    
    setIsDrawing(false);
    
    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: tool === 'eraser' ? '#FFFFFF' : strokeColor,
        width: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
        timestamp: Date.now(),
      };
      
      setUndoStack(prev => [...prev, [newStroke]]);
      setStrokes(prev => {
        const newStrokes = [...prev, newStroke];
        return newStrokes;
      });
      
      onStrokeComplete?.(newStroke);
      
      // Notify of canvas change
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          onCanvasChange?.(canvas.toDataURL());
        }
      }, 10);
    }
    
    setCurrentStroke([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set up canvas for high DPI displays
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Digital Prescription Canvas</span>
          <div className="flex items-center space-x-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              disabled={disabled}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              disabled={disabled}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ref && 'current' in ref && ref.current?.undo()}
              disabled={disabled || strokes.length === 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ref && 'current' in ref && ref.current?.redo()}
              disabled={disabled || redoStack.length === 0}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ref && 'current' in ref && ref.current?.clearCanvas()}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Stroke Width:</label>
            <Slider
              value={[strokeWidth]}
              onValueChange={(value) => setStrokeWidth(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-24"
              disabled={disabled}
            />
            <span className="text-sm text-gray-500 w-8">{strokeWidth}px</span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Color:</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300"
              disabled={disabled}
            />
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block w-full cursor-crosshair touch-none"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              touchAction: 'none',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Use your mouse, stylus, or finger to write prescriptions. Supports pressure sensitivity on compatible devices.
        </div>
      </CardContent>
    </Card>
  );
});

Canvas.displayName = 'Canvas';