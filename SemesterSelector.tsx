/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Layers, Terminal } from 'lucide-react';
import { Subject } from '../types';

interface SemesterSelectorProps {
  currentSemester: number;
  onSelectSemester: (semesterId: number) => void;
  subjects: Subject[];
}

export default function SemesterSelector({
  currentSemester,
  onSelectSemester,
  subjects,
}: SemesterSelectorProps) {
  // Generates 8 levels representing Semesters 1 to 8
  const semesters = Array.from({ length: 8 }, (_, i) => {
    const id = i + 1;
    // Calculate folder count for each semester Stage
    const folderCount = subjects.filter((s) => s.semesterId === id).length;
    return {
      id,
      name: `SEMESTER ${id}`,
      levelCode: `STAGE_0${id}`,
      folderCount,
    };
  });

  return (
    <div id="semester-panel" className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Top Grid Deco */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
      
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-purple-400 rotate-12" />
        <h3 className="font-mono text-xs tracking-widest text-purple-400 font-semibold uppercase">
          INDEX_STAGE_MAP
        </h3>
      </div>

      <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed uppercase">
        SELECT THE ACTIVE ACADEMIC STAGE TO SYNCHRONIZE FILESYSTEM DATA
      </p>

      {/* Grid containing stages 1 to 8 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-2.5">
        {semesters.map((sem) => {
          const isActive = sem.id === currentSemester;
          return (
            <button
              id={`semester-stage-btn-${sem.id}`}
              key={sem.id}
              onClick={() => onSelectSemester(sem.id)}
              className={`
                group relative w-full text-left p-3 rounded border font-mono transition-all duration-300
                ${isActive
                  ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-purple-400/40 hover:bg-slate-900/40 hover:text-slate-200'
                }
              `}
            >
              {/* Pulse glowing state */}
              {isActive && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-500 font-semibold block tracking-widest">
                    {sem.levelCode}
                  </span>
                  <span className="text-xs font-bold font-sans tracking-wide block uppercase mt-0.5">
                    {sem.name}
                  </span>
                </div>
                
                {/* Metric/folders info */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">FOLDERS</span>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-purple-500" />
                    {sem.folderCount}
                  </span>
                </div>
              </div>

              {/* Selection visual line indicators */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-purple-500 rounded-r"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cyber stats monitor */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1 uppercase">
          <Terminal className="w-3.5 h-3.5 text-purple-500" />
          ACTIVE_ID: STG-0{currentSemester}
        </span>
        <span className="uppercase text-purple-500/80 font-bold">
          ONLINE_CORE
        </span>
      </div>
    </div>
  );
}
