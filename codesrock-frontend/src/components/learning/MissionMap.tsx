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
  // SVG coordinates: Nodes are positioned at X=280 (even) and X=720 (odd)
  // Y coordinates are index * 400 + 200
  const getPathSegments = () => {
    if (nodes.length <= 1) return { completed: "", locked: "" };
    
    let completedPath = "";
    let lockedPath = "";
    
    // Find the index of the first non-watched node (the active one)
    const activeIndex = nodes.findIndex(n => n.status === 'active' || n.status === 'available');
    const lastWatchedIndex = activeIndex === -1 ? nodes.length - 1 : activeIndex;

    const getNodeX = (i: number) => (i % 2 === 0 ? 300 : 700);
    const getNodeY = (i: number) => i * 400 + 200;

    for (let i = 0; i < nodes.length - 1; i++) {
      const x1 = getNodeX(i);
      const y1 = getNodeY(i);
      const x2 = getNodeX(i + 1);
      const y2 = getNodeY(i + 1);
      
      const midY = (y1 + y2) / 2;
      const segment = `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
      
      if (i < lastWatchedIndex) {
        completedPath += " " + segment;
      } else {
        lockedPath += " " + segment;
      }
    }
    
    return { completed: completedPath, locked: lockedPath };
  };

  const { completed, locked } = getPathSegments();

  return (
    <div className="relative w-full h-full animate-fade-in flex flex-col pr-4">
      {/* Map Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
           <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Learning Journey</h2>
          <p className="text-lg font-black text-deep-purple italic leading-none">{moduleTitle}</p>
        </div>
      </div>

      {/* The Journey Map Surface */}
      <div className="relative flex-1 pb-64 overflow-y-auto custom-scrollbar overflow-x-hidden px-8 rounded-[3rem] bg-[#FAFAFA] border border-muted/20 shadow-inner">
        {/* Connection Path SVG - Realistic Winding Road */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 4000" preserveAspectRatio="xMidYMin meet">
           {/* Shadow/Outline Path */}
           <path 
            d={completed + " " + locked}
            fill="none" 
            stroke="rgba(0,0,0,0.03)" 
            strokeWidth="24" 
            strokeLinecap="round"
          />
          
          {/* Completed/Active Path (Colored) */}
          <path 
            d={completed}
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="14" 
            strokeDasharray="1 25"
            strokeLinecap="round"
            className="opacity-60"
          />
          <path 
            d={completed}
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="6" 
            strokeLinecap="round"
            className="opacity-20"
          />

          {/* Locked Path (Gray) */}
          <path 
            d={locked}
            fill="none" 
            stroke="#CBD5E1" 
            strokeWidth="14" 
            strokeDasharray="1 25"
            strokeLinecap="round"
            className="opacity-40"
          />
        </svg>

        <div className="relative flex flex-col gap-0 py-20">
          {nodes.map((node, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === nodes.length - 1;
            
            return (
              <div 
                key={node.id} 
                style={{ height: '400px' }}
                className={`flex items-center w-full max-w-4xl mx-auto relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Rocky Flags as Destinations - Guide Rocky */}
                {node.status === 'active' && (
                  <div className={`absolute -top-16 ${isEven ? 'left-[22%]' : 'right-[22%]'} z-30 animate-bounce-subtle`}>
                    <img 
                      src="/assets/rocky/idea-transparent.webp" 
                      alt="Rocky" 
                      className="w-20 h-20 object-contain drop-shadow-xl"
                    />
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border-2 border-primary/30 text-[10px] font-black text-primary uppercase shadow-lg mt-1 whitespace-nowrap">
                       You are here! 📍
                    </div>
                  </div>
                )}

                {/* Final Destination Celebration Rocky - Ghost Mode till completed */}
                {isLast && (
                  <div className={`absolute -bottom-48 left-1/2 -translate-x-1/2 z-40 transition-all duration-1000 ${node.status === 'watched' ? 'animate-pulse-slow scale-125' : 'opacity-40 grayscale blur-[1px]'}`}>
                    <img 
                      src="/assets/rocky/rocky-celebration-final.png" 
                      alt="Celebration Rocky" 
                      className={`w-44 h-44 object-contain drop-shadow-2xl transition-all duration-1000 ${node.status !== 'watched' ? 'brightness-50' : ''}`}
                    />
                    <div className="text-center mt-2">
                       <p className={`text-xs font-black uppercase tracking-[0.2em] bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-2xl border-2 transition-all duration-1000 ${node.status === 'watched' ? 'text-deep-purple border-primary/30' : 'text-muted-foreground border-transparent'}`}>
                          {node.status === 'watched' ? 'Module Mastered! 🏆' : 'The Finish Line'}
                       </p>
                    </div>
                  </div>
                )}

                {/* The Destination Node (Station) */}
                <div className="w-[45%] flex justify-center z-20">
                  <Card 
                    className={`
                      w-full overflow-hidden rounded-[2.5rem] transition-all duration-500 cursor-pointer border-8 group relative
                      ${node.status === 'active' ? 'border-primary shadow-[0_20px_50px_rgba(0,0,0,0.15)] scale-105' : 'border-white hover:border-primary/40 shadow-xl'}
                    `}
                    onClick={() => onNodeClick(node)}
                  >
                    <CardContent className="p-0">
                      {/* Video Thumbnail Area */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        <img 
                          src={node.thumbnail || "/assets/images/course-placeholder.jpg"} 
                          alt={node.title} 
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${node.status === 'available' ? 'saturate-50 opacity-80' : ''}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                          }}
                        />
                        
                        {/* Status Layers */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${node.status === 'active' ? 'bg-black/5' : 'bg-black/20 group-hover:bg-black/10'}`}>
                           <div className={`
                              w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
                              ${node.status === 'active' ? 'bg-primary text-white scale-110' : 'bg-white text-primary group-hover:scale-110'}
                           `}>
                              {node.status === 'watched' ? <CheckCircle className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                           </div>
                        </div>

                        <div className="absolute top-4 left-4">
                           <Badge className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${node.status === 'watched' ? 'bg-green-500' : node.status === 'active' ? 'bg-primary animate-pulse' : 'bg-slate-500 text-white'}`}>
                              {node.status === 'watched' ? 'Mastered' : node.status === 'active' ? 'Learning' : 'Upcoming'}
                           </Badge>
                        </div>
                      </div>

                      {/* Lesson Details */}
                      <div className="p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                           <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/60" /> {node.duration || 5} MINS</span>
                           <span className="flex items-center gap-2 text-primary"><Star className="h-4 w-4 fill-primary" /> +{node.xpReward} XP</span>
                        </div>
                        <h3 className="text-base font-black text-deep-purple leading-tight line-clamp-2 italic">{index + 1}. {node.title}</h3>
                        
                        <Button 
                          className={`w-full rounded-2xl font-black h-12 text-sm transition-all shadow-lg ${node.status === 'active' ? 'bg-primary hover:scale-[1.02]' : 'bg-muted/10 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 border-2 border-transparent'}`}
                        >
                           {node.status === 'watched' ? 'Review Lesson' : node.status === 'active' ? 'Continue Journey' : 'View Lesson'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Path Space */}
                <div className="w-[55%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
