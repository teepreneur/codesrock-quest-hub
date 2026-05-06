import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Star, Clock, Heart, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MissionNode {
  id: string;
  title: string;
  description?: string;
  status: 'watched' | 'active' | 'locked';
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
    <div className="relative w-full h-full bg-white rounded-[2.5rem] border border-muted/30 shadow-xl overflow-hidden animate-fade-in flex flex-col">
      {/* Dotted Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(circle, #000 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Header Stats */}
      <div className="relative z-10 p-8 flex justify-between items-start shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-deep-purple leading-tight">Mission Map</h2>
          <p className="text-muted-foreground font-bold italic tracking-tight">Trace your path through the {moduleTitle}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-muted/50 shadow-sm flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <span className="font-black text-deep-purple">3 Hearts</span>
          </div>
          <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-muted/50 shadow-sm flex items-center gap-3">
            <Coins className="h-5 w-5 text-orange-400 fill-orange-400" />
            <span className="font-black text-deep-purple">150 Coins</span>
          </div>
        </div>
      </div>

      {/* The Path Container */}
      <div className="relative z-10 flex-1 p-10 flex flex-wrap justify-center gap-16 items-center overflow-y-auto custom-scrollbar">
        
        {/* Connection Lines (SVG) - Hidden on mobile, simplified for desktop */}
        <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-20" viewBox="0 0 1000 800">
          <path 
            d="M100,400 Q300,200 500,400 T900,400" 
            fill="none" 
            stroke="#6366F1" 
            strokeWidth="4" 
            strokeDasharray="12 12"
          />
        </svg>

        {nodes.map((node, index) => (
          <div key={node.id} className="relative group animate-slide-up shrink-0" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Active Badge */}
            {node.status === 'active' && (
               <div className="absolute -top-3 -right-3 z-20">
                  <Badge className="bg-primary text-white font-black px-3 py-1 shadow-lg shadow-primary/30">ACTIVE</Badge>
               </div>
            )}

            <Card 
              className={`
                w-64 overflow-hidden rounded-[2rem] transition-all duration-500 cursor-pointer border-2
                ${node.status === 'active' ? 'border-primary ring-4 ring-primary/10 scale-105 shadow-2xl' : 'border-muted/30 hover:border-primary/50 hover:shadow-xl'}
                ${node.status === 'watched' ? 'bg-green-50/10 border-green-500/30' : 'bg-white'}
              `}
              onClick={() => onNodeClick(node)}
            >
              <CardContent className="p-0">
                {/* Thumbnail Area */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {node.thumbnail ? (
                    <img src={node.thumbnail} alt={node.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                       <Play className={`h-10 w-10 ${node.status === 'watched' ? 'text-green-500' : 'text-primary opacity-20'}`} />
                    </div>
                  )}
                  
                  {node.status === 'watched' && (
                    <div className="absolute inset-0 bg-green-500/5 flex items-center justify-center backdrop-blur-[1px]">
                       <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-green-500">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                       </div>
                    </div>
                  )}

                  {node.status === 'active' && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-primary">
                           <Play className="h-6 w-6 text-primary fill-primary ml-1" />
                        </div>
                     </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    {node.status === 'watched' ? (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black text-[9px] uppercase tracking-wider">COMPLETE</Badge>
                    ) : (
                       <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[9px] uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          <span>{node.duration || 5} MINS</span>
                       </div>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-deep-purple leading-tight line-clamp-2">{index + 1}. {node.title}</h3>
                  
                  {node.status === 'active' ? (
                    <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 h-9 text-xs">
                      Resume Lesson
                    </Button>
                  ) : node.status === 'watched' ? (
                    <p className="text-[10px] font-black text-green-600 text-center py-2 tracking-tight uppercase">Mastered 🤘</p>
                  ) : (
                    <Button variant="outline" className="w-full rounded-xl border-muted/50 font-black h-9 text-xs hover:bg-primary/5 hover:text-primary">
                      Start Lesson
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
