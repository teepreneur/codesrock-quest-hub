import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MissionNode {
  id: string;
  title: string;
  description?: string;
  status: 'watched' | 'active' | 'available';
  type: 'video' | 'activity';
  duration?: number;
  thumbnail?: string;
  xpReward: number;
}

interface MissionMapProps {
  nodes: MissionNode[];
  onNodeClick: (node: MissionNode) => void;
  moduleTitle: string;
}

export const MissionMap: React.FC<MissionMapProps> = ({ nodes, onNodeClick, moduleTitle }) => {
  return (
    <div className="relative w-full h-full animate-fade-in flex flex-col pr-4">
      {/* Integrated Header */}
      <div className="mb-6 flex flex-col">
        <h2 className="text-lg font-black text-deep-purple tracking-tight italic opacity-80">Mission Map</h2>
        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60">{moduleTitle}</p>
      </div>

      {/* The Journey Path */}
      <div className="relative flex-1 pb-20 overflow-y-auto custom-scrollbar overflow-x-hidden px-4">
        {/* Connection Path SVG - More fluid zig-zag */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]" preserveAspectRatio="none">
           <path 
            d={`M 50%,50 ${nodes.map((_, i) => `C ${i % 2 === 0 ? '70%' : '30%'},${i * 220 + 100} ${i % 2 === 0 ? '70%' : '30%'},${i * 220 + 180} 50%,${i * 220 + 250}`).join(' ')}`}
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="6" 
            strokeDasharray="12 12"
          />
        </svg>

        <div className="relative flex flex-col items-center gap-12 py-4">
          {nodes.map((node, index) => {
            const isEven = index % 2 === 0;
            return (
              <div 
                key={node.id} 
                className={`flex items-center w-full max-w-3xl ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Compact Mission Card */}
                <div className="w-[45%] flex justify-center">
                  <Card 
                    className={`
                      w-full max-w-[240px] overflow-hidden rounded-[1.5rem] transition-all duration-500 cursor-pointer border-2 group
                      ${node.status === 'active' ? 'border-primary shadow-xl scale-105' : 'border-transparent bg-white/40 backdrop-blur-sm hover:border-primary/30 shadow-md hover:shadow-lg'}
                      ${node.status === 'watched' ? 'opacity-90' : ''}
                    `}
                    onClick={() => onNodeClick(node)}
                  >
                    <CardContent className="p-0">
                      {/* Video Thumbnail Area */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {node.thumbnail ? (
                          <img src={node.thumbnail} alt={node.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-white flex items-center justify-center">
                             <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-inner">
                                <Play className="h-5 w-5 text-primary opacity-30 group-hover:opacity-100 transition-opacity ml-0.5" />
                             </div>
                          </div>
                        )}
                        
                        {/* Status Overlay */}
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center">
                           {node.status === 'active' && (
                             <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg animate-pulse">
                                <Play className="h-5 w-5 fill-current ml-0.5" />
                             </div>
                           )}
                           {node.status === 'watched' && (
                             <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-5 w-5" />
                             </div>
                           )}
                        </div>

                        {/* Top-Right Badge */}
                        <div className="absolute top-2 right-2">
                           <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 tracking-tighter ${node.status === 'watched' ? 'bg-green-500' : node.status === 'active' ? 'bg-primary' : 'bg-muted text-muted-foreground'}`}>
                              {node.status}
                           </Badge>
                        </div>
                      </div>

                      {/* Integrated Info Area */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                           <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {node.duration || 5}M</span>
                           <span className="flex items-center gap-1 text-primary"><Star className="h-2.5 w-2.5 fill-primary" /> +{node.xpReward} XP</span>
                        </div>
                        <h3 className="text-xs font-black text-deep-purple leading-tight line-clamp-2">{index + 1}. {node.title}</h3>
                        
                        <Button 
                          className={`w-full rounded-xl font-black h-8 text-[10px] transition-all shadow-sm ${node.status === 'active' ? 'bg-primary text-white' : 'bg-white border border-muted/20 text-muted-foreground hover:text-primary hover:border-primary/30'}`}
                        >
                           {node.status === 'watched' ? 'Review' : node.status === 'active' ? 'Resume' : 'Start'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Zig-Zag Gap */}
                <div className="w-[55%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
