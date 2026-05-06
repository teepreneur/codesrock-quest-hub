import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Star, Clock, MapPin } from "lucide-react";
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
      {/* Map Header - Legend Style */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
           <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Mission Map</h2>
          <p className="text-lg font-black text-deep-purple italic leading-none">{moduleTitle}</p>
        </div>
      </div>

      {/* The Journey Map Surface */}
      <div className="relative flex-1 pb-24 overflow-y-auto custom-scrollbar overflow-x-hidden px-8 rounded-[3rem] bg-[#FAFAFA] border border-muted/20 shadow-inner">
        {/* Connection Path SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" preserveAspectRatio="none">
           <path 
            d={`M 50%,100 ${nodes.map((_, i) => `C ${i % 2 === 0 ? '75%' : '25%'},${i * 240 + 150} ${i % 2 === 0 ? '75%' : '25%'},${i * 240 + 220} 50%,${i * 240 + 300}`).join(' ')}`}
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="4" 
            strokeDasharray="10 10"
          />
        </svg>

        <div className="relative flex flex-col items-center gap-16 py-12">
          {nodes.map((node, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === nodes.length - 1;
            
            return (
              <div 
                key={node.id} 
                className={`flex items-center w-full max-w-2xl relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Rocky Flags as Destinations */}
                {(node.status === 'active' || node.status === 'watched') && (
                  <div className={`absolute -top-12 ${isEven ? 'right-0' : 'left-0'} z-20 animate-bounce-subtle`}>
                    <img 
                      src={node.status === 'watched' ? "/assets/rocky/celebration-transparent.webp" : "/assets/rocky/idea-transparent.webp"} 
                      alt="Rocky" 
                      className="w-16 h-16 object-contain drop-shadow-xl"
                    />
                    <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/20 text-[8px] font-black text-primary uppercase shadow-sm mt-1">
                       {node.status === 'watched' ? 'Mission Cleared!' : 'Scouting Mission...'}
                    </div>
                  </div>
                )}

                {/* The Destination Node */}
                <div className="w-[48%] flex justify-center">
                  <Card 
                    className={`
                      w-full overflow-hidden rounded-[2rem] transition-all duration-500 cursor-pointer border-4 group relative
                      ${node.status === 'active' ? 'border-primary shadow-2xl scale-105' : 'border-white hover:border-primary/50 shadow-xl'}
                    `}
                    onClick={() => onNodeClick(node)}
                  >
                    <CardContent className="p-0">
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {node.thumbnail ? (
                          <img src={node.thumbnail} alt={node.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-white to-primary/5 flex items-center justify-center">
                             <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-primary/10">
                                <Play className="h-6 w-6 text-primary opacity-30 group-hover:opacity-100 transition-opacity ml-1" />
                             </div>
                          </div>
                        )}
                        
                        {/* Status Layers */}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-transparent transition-colors">
                           <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
                              ${node.status === 'active' ? 'bg-primary text-white scale-110' : 'bg-white text-primary group-hover:scale-110'}
                           `}>
                              {node.status === 'watched' ? <CheckCircle className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current ml-1" />}
                           </div>
                        </div>

                        <div className="absolute top-3 left-3">
                           <Badge className={`text-[9px] font-black uppercase px-2.5 py-1 ${node.status === 'watched' ? 'bg-green-500' : node.status === 'active' ? 'bg-primary' : 'bg-muted text-muted-foreground'}`}>
                              {node.status}
                           </Badge>
                        </div>
                      </div>

                      {/* Lesson Details */}
                      <div className="p-5 bg-white space-y-3">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
                           <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {node.duration || 5} MINS</span>
                           <span className="flex items-center gap-1.5 text-primary"><Star className="h-3 w-3 fill-primary" /> +{node.xpReward} XP</span>
                        </div>
                        <h3 className="text-sm font-black text-deep-purple leading-tight line-clamp-2 italic">{index + 1}. {node.title}</h3>
                        
                        <Button 
                          className={`w-full rounded-xl font-black h-10 text-xs transition-all shadow-md ${node.status === 'active' ? 'bg-primary' : 'bg-muted/10 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 border-2 border-transparent'}`}
                        >
                           {node.status === 'watched' ? 'Re-play Mission' : node.status === 'active' ? 'Resume Mission' : 'Start Mission'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Path Gap */}
                <div className="w-[52%]" />
              </div>
            );
          })}
        </div>

        {/* Floating Rocky Decorative Element at Bottom */}
        <div className="absolute bottom-10 right-10 opacity-30 pointer-events-none group-hover:opacity-100 transition-opacity">
           <img src="/assets/rocky/idea-transparent.webp" alt="Rocky" className="w-24 h-24 grayscale brightness-150 rotate-12" />
        </div>
      </div>
    </div>
  );
};
