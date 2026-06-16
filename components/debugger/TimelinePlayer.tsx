"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { SwarmMemorySnapshot } from '@/lib/engine/types/blackboard';

interface TimelinePlayerProps {
  sessionId: string;
  onSnapshotSelect: (snapshot: SwarmMemorySnapshot | null) => void;
}

export function TimelinePlayer({ sessionId, onSnapshotSelect }: TimelinePlayerProps) {
  const [snapshots, setSnapshots] = useState<SwarmMemorySnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/timeline`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.snapshots) {
          setSnapshots(data.snapshots);
          if (data.snapshots.length > 0) {
            setCurrentIndex(data.snapshots.length - 1);
            onSnapshotSelect(data.snapshots[data.snapshots.length - 1]);
          }
        }
      })
      .catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          onSnapshotSelect(snapshots[next]);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, snapshots, onSnapshotSelect]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setCurrentIndex(val);
    onSnapshotSelect(snapshots[val]);
  };

  if (snapshots.length === 0) {
    return <div className="text-neutral-500 text-sm p-4">No timeline data available.</div>;
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCurrentIndex(0)} className="text-neutral-400 hover:text-white transition-colors">
          <SkipBack size={20} />
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full transition-colors"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => setCurrentIndex(snapshots.length - 1)} className="text-neutral-400 hover:text-white transition-colors">
          <SkipForward size={20} />
        </button>
        <div className="text-xs text-neutral-400 ml-auto">
          Frame {currentIndex + 1} of {snapshots.length}
        </div>
      </div>
      
      <input 
        type="range" 
        min="0" 
        max={snapshots.length - 1} 
        value={currentIndex} 
        onChange={handleSliderChange}
        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
      
      <div className="flex justify-between mt-2 text-[10px] text-neutral-500 font-mono">
        <span>{new Date(snapshots[0].timestamp).toLocaleTimeString()}</span>
        <span>{new Date(snapshots[currentIndex].timestamp).toLocaleTimeString()}</span>
        <span>{new Date(snapshots[snapshots.length - 1].timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
