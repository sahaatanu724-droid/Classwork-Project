/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Image, Download, Trash2, Calendar, FileCode, CheckSquare, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Classwork, Subject } from '../types';
import { useState, useMemo } from 'react';

interface ClassworkListProps {
  classworks: Classwork[];
  subjects: Subject[];
  activeSubjectId: string | null;
  selectedDate: string; // YYYY-MM-DD
  currentSemester: number;
  onDeleteClasswork: (id: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterByDate: boolean;
  onToggleFilterByDate: () => void;
}

export default function ClassworkList({
  classworks,
  subjects,
  activeSubjectId,
  selectedDate,
  currentSemester,
  onDeleteClasswork,
  searchQuery,
  onSearchChange,
  filterByDate,
  onToggleFilterByDate,
}: ClassworkListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map subject ID to Name for quick lookups
  const subjectNameMap = useMemo(() => {
    return subjects.reduce((acc, sub) => {
      acc[sub.id] = sub.name;
      return acc;
    }, {} as Record<string, string>);
  }, [subjects]);

  const subjectCodeMap = useMemo(() => {
    return subjects.reduce((acc, sub) => {
      if (sub.code) acc[sub.id] = sub.code;
      return acc;
    }, {} as Record<string, string>);
  }, [subjects]);

  // Format bytes to human readable sizes
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Safe file type color coding & icon assignment
  const getFileStats = (fileType: string) => {
    const t = fileType.toLowerCase();
    if (t === 'pdf') {
      return {
        icon: <FileText className="w-5 h-5 text-rose-400" />,
        color: 'border-l-4 border-l-rose-500 bg-rose-950/10',
        badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      };
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(t)) {
      return {
        icon: <Image className="w-5 h-5 text-amber-400" />,
        color: 'border-l-4 border-l-amber-500 bg-amber-950/10',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      };
    } else if (['doc', 'docx', 'txt', 'pages'].includes(t)) {
      return {
        icon: <FileText className="w-5 h-5 text-blue-400" />,
        color: 'border-l-4 border-l-blue-500 bg-blue-950/10',
        badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      };
    } else if (['xls', 'xlsx', 'csv', 'numbers'].includes(t)) {
      return {
        icon: <FileCode className="w-5 h-5 text-emerald-400" />,
        color: 'border-l-4 border-l-emerald-500 bg-emerald-950/10',
        badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      };
    }
    return {
      icon: <FileText className="w-5 h-5 text-sky-400" />,
      color: 'border-l-4 border-l-slate-500 bg-slate-950/10',
      badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    };
  };

  // Filter the list based on selection states, date toggle, and search inputs
  const filteredClassworks = useMemo(() => {
    return classworks.filter((item) => {
      // Semester Id matches (already filter on mount/refresh but protect here)
      if (item.semesterId !== currentSemester) return false;

      // Subject Id matches if a specific subject is ticked
      if (activeSubjectId !== null && item.subjectId !== activeSubjectId) return false;

      // Date matches if Calendar restriction is turned ON
      if (filterByDate && item.date !== selectedDate) return false;

      // Search matches title, description, filename, or subject code
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const subjectName = (subjectNameMap[item.subjectId] || '').toLowerCase();
        const subjectCode = (subjectCodeMap[item.subjectId] || '').toLowerCase();
        
        const nameMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const fileMatch = item.fileName.toLowerCase().includes(q);
        const subMatch = subjectName.includes(q) || subjectCode.includes(q);

        if (!nameMatch && !descMatch && !fileMatch && !subMatch) return false;
      }

      return true;
    });
  }, [classworks, activeSubjectId, selectedDate, currentSemester, filterByDate, searchQuery, subjectNameMap, subjectCodeMap]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    try {
      await onDeleteClasswork(id);
      setDeletingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="classworks-archives-widget" className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl backdrop-blur-md relative">
      {/* Search and control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-mono text-xs tracking-widest text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-cyan-500" />
            WORKLOAD_ARCHIVES
          </h3>
          <p className="font-mono text-[10px] text-slate-400 mt-1 uppercase">
            {activeSubjectId 
              ? `VAULT: ${subjectNameMap[activeSubjectId] || 'LOADED'} · LEVEL ${currentSemester}` 
              : `ALL VAULTS · LEVEL ${currentSemester}`
            }
          </p>
        </div>

        {/* Date Filter Checkbox & Searchbox */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle date restriction */}
          <button
            id="toggle-date-filter-btn"
            onClick={onToggleFilterByDate}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs border transition-all duration-200
              ${filterByDate
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <Calendar className="w-3.5 h-3.5" />
            {filterByDate ? `FILTER: ${selectedDate}` : 'FILTER_BY_DATE (DISABLED)'}
          </button>

          {/* Search Term */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              id="search-archives-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Query logs..."
              className="bg-slate-950 border border-slate-800 font-mono text-xs pl-8 pr-3 py-1.5 rounded w-full md:w-44 focus:outline-none focus:border-cyan-400 text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Classworks Output List */}
      {filteredClassworks.length === 0 ? (
        <div id="empty-classwork-logs" className="border border-dashed border-slate-800 p-12 rounded text-center">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 font-mono text-xs uppercase font-bold tracking-wide">
            NO SYNC FILES FOUND
          </p>
          <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 leading-relaxed max-w-[320px] mx-auto">
            {filterByDate 
              ? `There are no classwork documents recorded on physical target date: ${selectedDate} under current directory setup.`
              : 'There are no files recorded matching current level setup. Drop files onto active airdrop portal to synchronize.'
            }
          </p>
          {filterByDate && (
            <button
              id="disable-date-filter-inline"
              onClick={onToggleFilterByDate}
              className="mt-3.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 font-mono text-[10px] text-slate-300 rounded uppercase border border-slate-700"
            >
              Examine full history
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClassworks.map((item) => {
            const stats = getFileStats(item.fileType);
            const isArmingDelete = deletingId === item.id;
            const subjectName = subjectNameMap[item.subjectId] || 'General Subject';
            const subjectCode = subjectCodeMap[item.subjectId];

            return (
              <div
                key={item.id}
                className={`
                  p-4 rounded border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden
                  ${stats.color}
                `}
              >
                {/* Content block */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="shrink-0 p-2 bg-slate-950/80 rounded border border-slate-800/60 mt-1">
                    {stats.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold select-none ${stats.badge}`}>
                        {item.fileType}
                      </span>
                      {subjectCode && (
                        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-mono text-[8.5px] leading-none uppercase">
                          {subjectCode}
                        </span>
                      )}
                      <span className="bg-slate-950/80 border border-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded font-mono text-[8.5px] leading-none uppercase flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-cyan-400" />
                        {item.date}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-slate-200 text-sm tracking-wide leading-snug truncate">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed line-clamp-2 uppercase tracking-wide text-[10px]">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                      <span>FILE: {item.fileName}</span>
                      <span>·</span>
                      <span>SIZE: {formatSize(item.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="flex items-center gap-2 relative z-10 shrink-0 sm:self-center">
                  {/* Download stream trigger */}
                  <a
                    id={`download-classwork-link-${item.id}`}
                    href={`/api/classworks/${item.id}/download`}
                    download={item.fileName}
                    className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded font-mono text-xs transition-all uppercase"
                    title="RETRIEVE COMPLETE WORKLOAD"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    DOWNLOAD
                  </a>

                  {/* Remove capability */}
                  <button
                    id={`delete-classwork-btn-${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    onMouseLeave={() => setDeletingId(null)}
                    className={`flex items-center justify-center p-2 rounded border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors ${
                      isArmingDelete ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-slate-950'
                    }`}
                    title={isArmingDelete ? 'CLICK AGAIN TO PURGE' : 'DELETE LOG'}
                  >
                    {isArmingDelete ? (
                      <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
                    ) : (
                      <Trash2 className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
