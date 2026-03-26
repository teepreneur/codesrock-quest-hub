import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestNode {
  id: string;
  title: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  type: 'video' | 'quiz' | 'activity';
  xpReward: number;
}

interface QuestMapProps {
  nodes: QuestNode[];
  onNodeClick: (node: QuestNode) => void;
}

export const QuestMap: React.FC<QuestMapProps> = ({ nodes, onNodeClick }) => {
  return (
    <div className="relative p-8 overflow-x-auto min-h-[400px]">
      <div className="flex flex-wrap justify-center gap-12 items-center relative">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          
          return (
            <React.Fragment key={node.id}>
              <div className="flex flex-col items-center gap-3 group relative">
                {/* Node Circle */}
                <button
                  onClick={() => onNodeClick(node)}
                  disabled={node.status === 'locked'}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 shadow-lg
                    ${node.status === 'completed' ? 'bg-green-500 text-white border-4 border-green-200 shadow-green-200' : ''}
                    ${node.status === 'in-progress' ? 'bg-primary text-white border-4 border-primary/30 animate-pulse-slow shadow-primary/30' : ''}
                    ${node.status === 'available' ? 'bg-white border-4 border-primary text-primary hover:bg-primary/5 shadow-primary/10' : ''}
                    ${node.status === 'locked' ? 'bg-muted text-muted-foreground border-4 border-muted/50 opacity-60 grayscale' : ''}
                  `}
                >
                  {node.status === 'completed' ? (
                    <CheckCircle className="h-10 w-10" />
                  ) : node.status === 'locked' ? (
                    <Lock className="h-8 w-8" />
                  ) : (
                    <span className="text-2xl font-bold">{index + 1}</span>
                  )}
                </button>

                {/* Node Title */}
                <div className="text-center max-w-[120px]">
                  <p className={`text-sm font-semibold truncate ${node.status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {node.title}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs font-medium text-primary">+{node.xpReward}</span>
                  </div>
                </div>

                {/* Connection Line (SVG) */}
                {!isLast && (
                  <div className="hidden lg:block absolute left-full top-10 w-12 h-1 bg-border -z-10 -translate-y-1/2">
                    <div 
                      className={`h-full transition-all duration-500 ${node.status === 'completed' ? 'bg-green-500' : 'bg-transparent'}`} 
                      style={{ width: node.status === 'completed' ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Background decoration (The "Path") */}
      <svg className="absolute top-0 left-0 w-full h-full -z-20 opacity-5 pointer-events-none" viewBox="0 0 1000 400">
        <path 
          d="M100,200 Q300,50 500,200 T900,200" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeDasharray="8 8"
          className="text-primary"
        />
      </svg>
    </div>
  );
};
