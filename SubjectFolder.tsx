/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Folder, FolderOpen, Plus, Trash2, ShieldAlert, Cpu } from 'lucide-react';
import { Subject } from '../types';

interface SubjectFolderProps {
  subjects: Subject[];
  activeSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  onCreateSubject: (name: string, code?: string) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
  classworksCountMap: Record<string, number>; // subjectId -> count
}

export default function SubjectFolder({
  subjects,
  activeSubjectId,
  onSelectSubject,
  onCreateSubject,
  onDeleteSubject,
  classworksCountMap,
}: SubjectFolderProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setError('FOLDER_NAME CANNOT BE VACANT');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onCreateSubject(newFolderName.trim(), newFolderCode.trim() || undefined);
      setNewFolderName('');
      setNewFolderCode('');
      setShowCreate(false);
    } catch (err: any) {
      setError(err?.message || 'FAILED_TO_GENERATE_DIRECTORY');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      // First click: arm delete logic
      setDeletingId(id);
      return;
    }

    try {
      await onDeleteSubject(id);
      if (activeSubjectId === id) {
        onSelectSubject(null);
      }
      setDeletingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="subject-folder-container" className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl backdrop-blur-md relative">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-emerald-400" />
          <h3 className="font-mono text-xs tracking-widest text-emerald-400 font-semibold uppercase">
            DIRECTORY_VAULTS
          </h3>
        </div>
        <button
          id="toggle-create-folder-btn"
          onClick={() => {
            setShowCreate(!showCreate);
            setError('');
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 font-mono text-xs transition-all uppercase"
        >
          <Plus className="w-4 h-4" />
          {showCreate ? 'CLOSE' : 'NEW_DIRECTORY'}
        </button>
      </div>

      {/* Creation terminal form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-slate-950/80 border border-emerald-500/20 rounded p-4 mb-5 font-mono text-xs">
          <h4 className="text-emerald-400 uppercase font-semibold tracking-wider mb-3 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            INITIALIZE_DIRECTORY_FLOW
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block uppercase tracking-wider mb-1 text-[10px]">Vault/Subject Name *</label>
              <input
                id="vault-name-input"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Applied Mechanics II"
                className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
            <div>
              <label className="text-slate-400 block uppercase tracking-wider mb-1 text-[10px]">Subject Key/Code (Optional)</label>
              <input
                id="vault-code-input"
                type="text"
                value={newFolderCode}
                onChange={(e) => setNewFolderCode(e.target.value)}
                placeholder="e.g. ME-202"
                className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {error && (
              <span className="text-rose-400 text-[11px] block mt-1 uppercase">
                ERROR_DGNSTC: {error}
              </span>
            )}

            <button
              id="confirm-create-vault-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 py-1.5 rounded transition-all uppercase tracking-wider font-bold"
            >
              {isSubmitting ? 'COMPILING...' : 'GENERATE_VAULT'}
            </button>
          </div>
        </form>
      )}

      {/* Folders List Render */}
      {subjects.length === 0 ? (
        <div id="no-vaults-state" className="border border-dashed border-slate-800 p-8 rounded text-center">
          <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2.5 opacity-40" />
          <p className="text-slate-500 font-mono text-xs uppercase">
            No subject vaults established in this level stage
          </p>
          <button
            id="prompt-create-dir-btn"
            onClick={() => setShowCreate(true)}
            className="mt-3 text-[11px] font-mono text-emerald-400 underline hover:text-emerald-300 uppercase"
          >
            Spawn classwork folder now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Always have an "ALL DIRECTORIES" card to view all current items */}
          <button
            id="vault-all-directories-btn"
            onClick={() => onSelectSubject(null)}
            className={`
              group relative text-left p-4 rounded border transition-all duration-300 flex flex-col justify-between h-28
              ${activeSubjectId === null
                ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-emerald-500/40 hover:bg-slate-900/30'
              }
            `}
          >
            <div className="flex items-start justify-between w-full">
              {activeSubjectId === null ? (
                <FolderOpen className="w-7 h-7 text-emerald-400" />
              ) : (
                <Folder className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              )}
              <span className="font-mono text-[9px] bg-slate-800/80 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded tracking-widest leading-none">
                ALL
              </span>
            </div>

            <div>
              <span className="font-bold text-sm block tracking-wide uppercase truncate">
                All Classworks
              </span>
              <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                FULL_VOLUME
              </span>
            </div>
          </button>

          {subjects.map((sub) => {
            const isActive = activeSubjectId === sub.id;
            const fileCount = classworksCountMap[sub.id] || 0;
            const isArmingDelete = deletingId === sub.id;

            return (
              <div
                key={sub.id}
                className={`
                  group relative rounded border transition-all duration-300 flex flex-col justify-between h-28 p-4
                  ${isActive
                    ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-emerald-500/40 hover:bg-slate-900/30'
                  }
                `}
              >
                {/* Click target wrapper for selection */}
                <div 
                  id={`select-subject-hitbox-${sub.id}`}
                  onClick={() => onSelectSubject(sub.id)}
                  className="absolute inset-0 cursor-pointer rounded z-0"
                />

                <div className="flex items-start justify-between w-full relative z-10 pointer-events-none">
                  {isActive ? (
                    <FolderOpen className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <Folder className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  )}

                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {sub.code && (
                      <span className="font-mono text-[9px] bg-slate-800/80 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded tracking-wide leading-none select-none">
                        {sub.code}
                      </span>
                    )}
                    {/* Delete folder action */}
                    <button
                      id={`delete-vault-btn-${sub.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sub.id);
                      }}
                      onMouseLeave={() => setDeletingId(null)}
                      className={`p-1 rounded text-slate-500 hover:text-rose-400 transition-colors ${
                        isArmingDelete ? 'bg-rose-500/20 text-rose-300' : ''
                      }`}
                      title={isArmingDelete ? 'CLICK AGAIN TO ERASE' : 'DELETE VAULT'}
                    >
                      {isArmingDelete ? <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-auto relative z-10 pointer-events-none">
                  <span className="font-light text-slate-400 block tracking-wide uppercase truncate leading-snug">
                    {sub.name}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 block mt-0.5 uppercase">
                    DATA_FILES: <span className="font-bold text-emerald-500/80">{fileCount}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
