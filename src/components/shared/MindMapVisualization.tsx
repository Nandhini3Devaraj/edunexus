/**
 * AI Mind Map Visualization - Enhanced with Separate Topic Views
 * Features:
 * - Separate mindmap for each topic
 * - Overview mode to see all topics
 * - Simple mode (classic classroom style)
 * - 3D mode with effects
 * - Clear topic labels and divisions
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MindMapNode, SeparateMindMapData, MindMapData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ZoomIn, ZoomOut, RotateCcw, Sparkles, BookOpen, 
  Layers, Box, ChevronRight, ChevronLeft, Grid3X3, List
} from 'lucide-react';

interface MindMapVisualizationProps {
  data: SeparateMindMapData | MindMapData | null;
  className?: string;
  onNodeClick?: (node: MindMapNode) => void;
}

interface Position { x: number; y: number; }
type ViewMode = '3d' | 'simple';
type DisplayMode = 'overview' | 'single';

// Check if data is SeparateMindMapData
const isSeparateData = (data: any): data is SeparateMindMapData => {
  return data && 'separate_mindmaps' in data && Array.isArray(data.separate_mindmaps);
};

// Calculate radial positions for visualization - IMPROVED SPACING
const calculatePositions = (
  node: MindMapNode,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  result: Map<string, Position>
): void => {
  result.set(node.id, { x: cx, y: cy });
  
  const children = node.children || [];
  if (children.length === 0) return;
  
  // Better spacing: larger angle spread for more children
  const angleSpread = Math.min(Math.PI * 1.8, (endAngle - startAngle));
  const step = angleSpread / Math.max(children.length, 1);
  const startOffset = (endAngle - startAngle - angleSpread) / 2;
  
  children.forEach((child, i) => {
    const angle = startAngle + startOffset + step * (i + 0.5);
    // Significantly larger radius for level 1 children
    const childRadius = radius * (node.level === 0 ? 1.6 : 1.1);
    const childX = cx + Math.cos(angle) * childRadius;
    const childY = cy + Math.sin(angle) * childRadius;
    // Tighter spread for grandchildren
    calculatePositions(child, childX, childY, childRadius * 0.7, angle - step/3, angle + step/3, result);
  });
};

// Flatten node tree
const flattenNodes = (node: MindMapNode, arr: MindMapNode[] = []): MindMapNode[] => {
  arr.push(node);
  (node.children || []).forEach(c => flattenNodes(c, arr));
  return arr;
};

// Get connections
const getConnections = (node: MindMapNode, arr: {from: string, to: string, color: string}[] = []) => {
  (node.children || []).forEach(child => {
    arr.push({ from: node.id, to: child.id, color: child.color || '#6366f1' });
    getConnections(child, arr);
  });
  return arr;
};

// Single Mind Map Canvas Component
const MindMapCanvas: React.FC<{
  mindmap: MindMapNode;
  viewMode: ViewMode;
  title?: string;
  color?: string;
  onNodeClick?: (node: MindMapNode) => void;
  compact?: boolean;
}> = ({ mindmap, viewMode, title, color, onNodeClick, compact = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(compact ? 0.85 : 1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [popupPos, setPopupPos] = useState<Position>({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: compact ? 400 : 900, h: compact ? 380 : 550 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) setDims({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const positions = useMemo(() => {
    const result = new Map<string, Position>();
    const cx = dims.w / 2 + pan.x;
    const cy = dims.h / 2 + pan.y;
    // Increased base radius for better spacing
    const radius = Math.min(dims.w, dims.h) * (compact ? 0.28 : 0.32) * zoom;
    calculatePositions(mindmap, cx, cy, radius, 0, 2 * Math.PI, result);
    return result;
  }, [mindmap, dims, pan, zoom, compact]);

  const nodes = useMemo(() => flattenNodes(mindmap), [mindmap]);
  const connections = useMemo(() => getConnections(mindmap), [mindmap]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  };

  const isSimple = viewMode === 'simple';
  const bgClass = isSimple 
    ? 'bg-white border-2 border-slate-200' 
    : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/10';

  const minHeight = compact ? 340 : 500;

  return (
    <div className="relative h-full">
      {/* Title Badge */}
      {title && (
        <div 
          className="absolute top-2 left-2 z-40 px-3 py-1.5 rounded-lg font-semibold text-sm shadow-lg"
          style={{ backgroundColor: color || '#6366f1', color: '#fff' }}
        >
          {title}
        </div>
      )}

      {/* Mini Controls */}
      {!compact && (
        <div className="absolute top-2 right-2 z-40 flex gap-1 bg-background/80 backdrop-blur rounded-lg p-1 border">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full relative overflow-hidden rounded-xl ${bgClass}`}
        style={{ cursor: 'grab', minHeight }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          const startX = e.clientX, startY = e.clientY;
          const startPan = { ...pan };
          const onMove = (ev: MouseEvent) => setPan({ x: startPan.x + ev.clientX - startX, y: startPan.y + ev.clientY - startY });
          const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        {/* Background */}
        {isSimple ? (
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        ) : (
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.2) 0%, transparent 50%)',
          }} />
        )}

        {/* SVG Lines */}
        <svg className="absolute inset-0 pointer-events-none" width={dims.w} height={dims.h}>
          {!isSimple && (
            <defs>
              <filter id={`glow-${mindmap.id}`}>
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
          )}
          {connections.map((c, i) => {
            const from = positions.get(c.from);
            const to = positions.get(c.to);
            if (!from || !to) return null;
            
            if (isSimple) {
              return (
                <line
                  key={i}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke="#64748b"
                  strokeWidth={2}
                />
              );
            } else {
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2 - 15;
              return (
                <g key={i}>
                  <path
                    d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                    fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={4}
                    transform="translate(1.5, 1.5)"
                  />
                  <path
                    d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                    fill="none" stroke={c.color} strokeWidth={3} strokeOpacity={0.85}
                    filter={`url(#glow-${mindmap.id})`}
                  />
                </g>
              );
            }
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const nodeColor = node.color || '#6366f1';
          
          // IMPROVED Shape sizes - Larger and clearer
          let w: number, h: number, borderRadius: string;
          if (node.level === 0) {
            // Root node - Large circle
            w = h = compact ? 80 : 100;
            borderRadius = '50%';
          } else {
            // Child nodes - Rounded rectangles with visible text
            w = compact ? 100 : 140;
            h = compact ? 38 : 48;
            borderRadius = '12px';
          }
          
          // Show more text - increased character limit
          const displayLabel = node.label.length > (compact ? 14 : 22) 
            ? node.label.slice(0, compact ? 12 : 20) + '...' 
            : node.label;
          
          const nodeStyle: React.CSSProperties = isSimple ? {
            borderRadius,
            background: node.level === 0 ? nodeColor : '#ffffff',
            border: `3px solid ${nodeColor}`,
            boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          } : {
            borderRadius,
            background: `linear-gradient(145deg, ${nodeColor}ee 0%, ${nodeColor}cc 50%, ${nodeColor}aa 100%)`,
            boxShadow: `0 8px 24px ${nodeColor}50, 0 4px 12px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.3)`,
            border: `2px solid rgba(255,255,255,0.25)`,
            transform: 'perspective(600px) rotateX(6deg)',
          };
          
          return (
            <div
              key={node.id}
              className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:z-50"
              style={{
                left: pos.x - w/2,
                top: pos.y - h/2,
                width: w,
                height: h,
                zIndex: 20 - node.level,
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                  setHoveredNode(node);
                  let px = rect.right - containerRect.left + 8;
                  if (px + 240 > dims.w) px = rect.left - containerRect.left - 250;
                  setPopupPos({ x: px, y: rect.top - containerRect.top });
                }
              }}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick?.(node)}
            >
              <div className="w-full h-full flex items-center justify-center relative" style={nodeStyle}>
                {/* 3D Highlight */}
                {!isSimple && (
                  <div 
                    className="absolute top-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: '45%',
                      borderRadius: `${borderRadius} ${borderRadius} 50% 50%`,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
                    }}
                  />
                )}
                <span 
                  className="relative z-10 font-bold text-center px-2"
                  style={{ 
                    color: (isSimple && node.level !== 0) ? '#1e293b' : '#ffffff',
                    fontSize: node.level === 0 ? (compact ? 12 : 15) : (compact ? 11 : 13),
                    textShadow: isSimple ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {displayLabel}
                </span>
              </div>
            </div>
          );
        })}

        {/* Hover Popup */}
        {hoveredNode && (
          <div
            className="absolute z-50 animate-in fade-in duration-150 pointer-events-none"
            style={{ left: popupPos.x, top: popupPos.y, maxWidth: 220 }}
          >
            <Card className={`border-2 shadow-xl ${isSimple ? 'bg-white' : 'bg-slate-900/95'}`} style={{ borderColor: hoveredNode.color }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: hoveredNode.color }} />
                  <h4 className={`font-bold text-sm ${isSimple ? 'text-slate-800' : 'text-white'}`}>
                    {hoveredNode.label}
                  </h4>
                </div>
                {hoveredNode.content_preview && (
                  <p className={`text-xs ${isSimple ? 'text-slate-600' : 'text-slate-300'} border-l-2 pl-2`} 
                     style={{ borderLeftColor: hoveredNode.color }}>
                    <BookOpen className="h-3 w-3 inline mr-1" />
                    {hoveredNode.content_preview}
                  </p>
                )}
                {hoveredNode.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hoveredNode.keywords.slice(0, 4).map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export const MindMapVisualization: React.FC<MindMapVisualizationProps> = ({ 
  data, 
  className = '',
  onNodeClick 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overview');
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);

  // Handle both data types
  const separateData = isSeparateData(data) ? data : null;
  const legacyData = !isSeparateData(data) ? data as MindMapData : null;

  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[400px] bg-muted/30 rounded-xl ${className}`}>
        <p className="text-muted-foreground">No mind map data</p>
      </div>
    );
  }

  // For legacy single mindmap data
  if (legacyData && legacyData.mindmap) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute top-2 right-2 z-50 flex gap-1 bg-background/80 backdrop-blur rounded-lg p-1 border">
          <Button variant={viewMode === 'simple' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('simple')}>
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === '3d' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('3d')}>
            <Box className="h-4 w-4" />
          </Button>
        </div>
        <MindMapCanvas 
          mindmap={legacyData.mindmap} 
          viewMode={viewMode}
          onNodeClick={onNodeClick}
        />
      </div>
    );
  }

  // For separate mindmaps data
  if (!separateData) return null;

  const { separate_mindmaps, topics_summary, statistics } = separateData;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Stats */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 mr-1" />
            {statistics.total_topics} Topics
          </Badge>
          <Badge variant="outline">
            {statistics.total_mindmaps} Mind Maps
          </Badge>
          <Badge variant="outline">
            {statistics.total_nodes} Nodes
          </Badge>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Display Mode */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button 
              variant={displayMode === 'overview' ? 'default' : 'ghost'} 
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setDisplayMode('overview')}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              All Topics
            </Button>
            <Button 
              variant={displayMode === 'single' ? 'default' : 'ghost'} 
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setDisplayMode('single')}
            >
              <List className="h-3.5 w-3.5" />
              Single View
            </Button>
          </div>

          {/* View Mode (Simple/3D) */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button variant={viewMode === 'simple' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setViewMode('simple')}>
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === '3d' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setViewMode('3d')}>
              <Box className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* OVERVIEW MODE - Grid of all topic mindmaps */}
      {displayMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {separate_mindmaps.map((topicMap, idx) => (
            <Card 
              key={topicMap.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTopicIndex(idx);
                setDisplayMode('single');
              }}
            >
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: topicMap.topic_color }}
                    />
                    <CardTitle className="text-base">{topicMap.topic_label}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {topicMap.node_count} nodes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[320px]">
                  <MindMapCanvas
                    mindmap={topicMap.mindmap}
                    viewMode={viewMode}
                    color={topicMap.topic_color}
                    onNodeClick={onNodeClick}
                    compact={true}
                  />
                </div>
                {/* Keywords preview */}
                <div className="flex flex-wrap gap-1 mt-2 px-2">
                  {topicMap.keywords.slice(0, 5).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SINGLE VIEW MODE - One topic at a time with navigation */}
      {displayMode === 'single' && (
        <div className="space-y-3">
          {/* Topic Navigation */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {topics_summary.map((topic, idx) => (
                <Button
                  key={topic.id}
                  variant={selectedTopicIndex === idx ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0 gap-2"
                  style={selectedTopicIndex === idx ? { backgroundColor: topic.color } : {}}
                  onClick={() => setSelectedTopicIndex(idx)}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: selectedTopicIndex === idx ? '#fff' : topic.color }}
                  />
                  {topic.label.length > 20 ? topic.label.slice(0, 18) + '...' : topic.label}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Topic Mind Map */}
          {separate_mindmaps[selectedTopicIndex] && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={selectedTopicIndex === 0}
                      onClick={() => setSelectedTopicIndex(i => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: separate_mindmaps[selectedTopicIndex].topic_color }}
                      />
                      <CardTitle className="text-lg">
                        Topic {selectedTopicIndex + 1}: {separate_mindmaps[selectedTopicIndex].topic_label}
                      </CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={selectedTopicIndex === separate_mindmaps.length - 1}
                      onClick={() => setSelectedTopicIndex(i => Math.min(separate_mindmaps.length - 1, i + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <Badge variant="outline">
                    {selectedTopicIndex + 1} / {separate_mindmaps.length}
                  </Badge>
                </div>
                {/* Topic Description */}
                {separate_mindmaps[selectedTopicIndex].description && (
                  <p className="text-sm text-muted-foreground mt-2 border-l-2 pl-3" 
                     style={{ borderLeftColor: separate_mindmaps[selectedTopicIndex].topic_color }}>
                    {separate_mindmaps[selectedTopicIndex].description.slice(0, 200)}
                    {separate_mindmaps[selectedTopicIndex].description.length > 200 && '...'}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-[500px]">
                  <MindMapCanvas
                    mindmap={separate_mindmaps[selectedTopicIndex].mindmap}
                    viewMode={viewMode}
                    title={`Topic ${selectedTopicIndex + 1}`}
                    color={separate_mindmaps[selectedTopicIndex].topic_color}
                    onNodeClick={onNodeClick}
                  />
                </div>
                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground mr-2">Keywords:</span>
                  {separate_mindmaps[selectedTopicIndex].keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MindMapVisualization;
