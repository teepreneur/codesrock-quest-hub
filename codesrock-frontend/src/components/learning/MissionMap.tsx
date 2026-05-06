import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Lock, Star, ChevronRight, Clock, Heart, Coins, Bell } from "lucide-react";
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
    <div className="relative w-full min-h-[700px] bg-white rounded-[2.5rem] border border-muted/30 shadow-2xl overflow-hidden animate-fade-in">
      {/* Dotted Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(circle, #000 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Header Stats */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
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
      <div className="relative z-10 p-20 pt-40 h-full flex flex-wrap justify-center gap-24 items-center">
        
        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none" viewBox="0 0 1000 800">
          <path 
            d="M200,400 Q400,200 600,400 T900,400" 
            fill="none" 
            stroke="#E2E8F0" 
            strokeWidth="4" 
            strokeDasharray="12 12"
          />
        </svg>

        {nodes.map((node, index) => (
          <div key={node.id} className="relative group animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
            {/* Status Indicator Connector */}
            {node.status === 'active' && (
               <div className="absolute -top-4 -right-4 z-20">
                  <Badge className="bg-primary text-white font-black px-3 py-1 animate-bounce">ACTIVE</Badge>
               </div>
            )}

            <Card 
              className={`
                w-64 overflow-hidden rounded-[2rem] transition-all duration-500 cursor-pointer
                ${node.status === 'active' ? 'ring-4 ring-primary ring-offset-4 scale-105 shadow-2xl' : 'hover:scale-105 hover:shadow-xl'}
                ${node.status === 'locked' ? 'opacity-50 grayscale pointer-events-none' : ''}
                ${node.status === 'watched' ? 'border-green-500/50' : 'border-muted/50'}
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
                       <Play className={`h-12 w-12 ${node.status === 'watched' ? 'text-green-500' : 'text-primary opacity-30'}`} />
                    </div>
                  )}
                  
                  {node.status === 'watched' && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px]">
                       <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-green-500">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                       </div>
                    </div>
                  )}

                  {node.status === 'active' && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-primary animate-pulse">
                           <Play className="h-6 w-6 text-primary fill-primary ml-1" />
                        </div>
                     </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    {node.status === 'watched' ? (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black text-[10px] uppercase">WATCHED</Badge>
                    ) : (
                       <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          <span>{node.duration || 5} MINS VIDEO</span>
                       </div>
                    )}
                  </div>

                  <h3 className="text-base font-black text-deep-purple leading-tight line-clamp-1">{index + 1}. {node.title}</h3>
                  
                  {node.status === 'active' ? (
                    <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 h-10">
                      Resume Lesson
                    </Button>
                  ) : node.status === 'watched' ? (
                    <p className="text-xs font-black text-green-600 text-center py-2 italic tracking-tight">Challenge Mastered! 🤘</p>
                  ) : (
                    <div className="flex items-center justify-center py-2">
                       <Lock className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Mission Spark Alert */}
      <div className="absolute bottom-8 right-8 left-8 z-20 flex justify-between items-end pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-muted/50 shadow-lg flex items-center gap-4 pointer-events-auto group">
           <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-muted overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">+12</div>
           </div>
           <p className="text-xs font-bold text-muted-foreground max-w-[180px]">
              <span className="text-deep-purple font-black">14 other teachers</span> are working on this module now!
           </p>
           <Button variant="link" className="text-deep-purple font-black h-auto p-0 flex items-center gap-1 hover:text-primary transition-colors">
              Mission Details <ChevronRight className="h-4 w-4" />
           </Button>
        </div>

        <div className="bg-orange-400 p-6 rounded-[2rem] border-4 border-orange-200 shadow-2xl max-w-sm pointer-events-auto animate-bounce-subtle">
           <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg transform -rotate-6">
                 <Star className="h-8 w-8 text-orange-400 fill-orange-400" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-xl font-black text-white leading-tight">Mission Spark!</h4>
                 <p className="text-sm font-bold text-white/90">You earned +50 XP for starting Module 1.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
