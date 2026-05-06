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
    <div className="relative w-full h-full animate-fade-in flex flex-col">
      {/* Header - Subtle & Integrated */}
      <div className="mb-8 flex flex-col gap-1">
        <h2 className="text-xl font-black text-deep-purple italic tracking-tight">Mission Map</h2>
        <p className="text-sm text-muted-foreground font-bold tracking-tight">Level: {moduleTitle}</p>
      </div>

      {/* The Journey Path */}
      <div className="relative flex-1 p-4 pb-20 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {/* The Connection SVG Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
           <path 
            d={`M ${nodes.length > 0 ? '50%' : '0'},100 ${nodes.map((_, i) => `Q ${i % 2 === 0 ? '80%' : '20%'},${i * 300 + 250} 50%,${i * 300 + 400}`).join(' ')}`}
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="8" 
            strokeDasharray="16 16"
          />
        </svg>

        <div className="relative flex flex-col items-center gap-24 py-10">
          {nodes.map((node, index) => {
            const isEven = index % 2 === 0;
            return (
              <div 
                key={node.id} 
                className={`flex items-center w-full max-w-4xl px-10 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Video Node Card */}
                <div className="w-1/2 flex justify-center">
                  <Card 
                    className={`
                      w-72 overflow-hidden rounded-[2rem] transition-all duration-500 cursor-pointer border-4 group
                      ${node.status === 'active' ? 'border-primary shadow-2xl scale-105' : 'border-white hover:border-primary/50 shadow-lg hover:shadow-xl'}
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
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                             <Play className="h-12 w-12 text-primary opacity-40 group-hover:scale-125 transition-transform" />
                          </div>
                        )}
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                           <div className={`
                              w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
                              ${node.status === 'active' ? 'bg-primary text-white scale-110' : 'bg-white text-primary group-hover:scale-110'}
                           `}>
                              {node.status === 'watched' ? (
                                <CheckCircle className="h-8 w-8" />
                              ) : (
                                <Play className="h-8 w-8 fill-current ml-1" />
                              )}
                           </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                           <Badge className={`font-black uppercase text-[9px] ${node.status === 'watched' ? 'bg-green-500' : node.status === 'active' ? 'bg-primary animate-pulse' : 'bg-muted'}`}>
                              {node.status}
                           </Badge>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-5 bg-white space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                           <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {node.duration || 5} MINS</span>
                           <span className="flex items-center gap-1 text-primary"><Star className="h-3 w-3 fill-primary" /> +{node.xpReward} XP</span>
                        </div>
                        <h3 className="text-sm font-black text-deep-purple leading-tight line-clamp-2">{index + 1}. {node.title}</h3>
                        
                        <Button className={`w-full rounded-xl font-black h-9 text-xs transition-all ${node.status === 'active' ? 'bg-primary' : 'variant-outline border-muted-foreground/20'}`}>
                           {node.status === 'watched' ? 'Watch Again' : node.status === 'active' ? 'Resume Mission' : 'Start Mission'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Empty Half to create the Zig-Zag flow */}
                <div className="w-1/2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
