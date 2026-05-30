/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Subject } from '../types';

interface ClassworkUploadFormProps {
  selectedDate: string; // YYYY-MM-DD
  currentSemester: number;
  subjects: Subject[];
  activeSubjectId: string | null;
  onUploadSuccess: () => void;
}

export default function ClassworkUploadForm({
  selectedDate,
  currentSemester,
  subjects,
  activeSubjectId,
  onUploadSuccess,
}: ClassworkUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSubjectId, setTargetSubjectId] = useState(activeSubjectId || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize targetSubjectId if activeSubjectId changes
  if (activeSubjectId && targetSubjectId !== activeSubjectId) {
    setTargetSubjectId(activeSubjectId);
  }

  const allowedExtensions = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt'
  ];

  const validateFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setError(`INVALID_EXTENSION: ALLOWED: ${allowedExtensions.join(', ').toUpperCase()}`);
      return false;
    }
    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
      setError('PAYLOAD_OVERFLOW: MAXIMUM SIZE LIMIT IS 50MB');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        // Pre-fill title from filename without extension
        const nameNoExt = selected.name.substring(0, selected.name.lastIndexOf('.')) || selected.name;
        setTitle(nameNoExt);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        const nameNoExt = selected.name.substring(0, selected.name.lastIndexOf('.')) || selected.name;
        setTitle(nameNoExt);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('NO_FILE_ATTACHED: PLEASE INCLUDE SOURCE FIELD');
      return;
    }
    if (!title.trim()) {
      setError('TITLE_VACANT: CLASSWORK CANNOT BE ANONYMOUS');
      return;
    }
    if (!targetSubjectId) {
      setError('NO_DIRECTORY_TARGETED: SELECT A REPOSITORY VAULT');
      return;
    }

    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('date', selectedDate);
    formData.append('semesterId', currentSemester.toString());
    formData.append('subjectId', targetSubjectId);

    try {
      const res = await fetch('/api/classworks', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'UPLOAD_FLOW_TERMINATED');
      }

      setFile(null);
      setTitle('');
      setDescription('');
      setSuccess(true);
      onUploadSuccess();

      // Clear success banner after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'FAILED_TO_CONNECT_TO_CORE_HOST');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="classwork-upload-card" className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl backdrop-blur-md relative">
      <div className="flex items-center gap-2 mb-4">
        <UploadCloud className="w-5 h-5 text-cyan-400" />
        <h3 className="font-mono text-xs tracking-widest text-cyan-400 font-semibold uppercase">
          AIRDROP_TERMINAL
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        {/* Dynamic target details row */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-2.5 rounded border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">LEVEL STAGE</span>
            <span className="text-purple-400 font-bold block uppercase mt-0.5">SEMESTER {currentSemester}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">TIMESTAMP TARGET</span>
            <span className="text-cyan-400 font-bold block uppercase mt-0.5">{selectedDate}</span>
          </div>
        </div>

        {/* Directory/Subject Vault selector */}
        <div>
          <label className="text-slate-400 block uppercase tracking-wider mb-1 text-[10px]">TARGET_VAULT_DIRECTORY *</label>
          <select
            id="target-subject-vault-select"
            value={targetSubjectId}
            onChange={(e) => setTargetSubjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 text-slate-300 rounded focus:outline-none focus:border-cyan-400 font-sans tracking-wide"
          >
            <option value="">-- SELECT CLASSWORK FOLDER --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code ? `[${sub.code}] ` : ''}{sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Core title input */}
        <div>
          <label className="text-slate-400 block uppercase tracking-wider mb-1 text-[10px]">CLASSWORK_IDENTIFIER / TITLE *</label>
          <input
            id="classwork-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lab Experiment 4 - Fiber Optics"
            className="w-full bg-slate-950 border border-slate-800 p-2.5 text-slate-200 rounded focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>

        {/* Optional description notes */}
        <div>
          <label className="text-slate-400 block uppercase tracking-wider mb-1 text-[10px]">ADDITIONAL_LOG_NOTES / LAB NOTES (OPTIONAL)</label>
          <textarea
            id="classwork-desc-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Include homework details, specific guidelines, or references..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 text-slate-200 rounded focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>

        {/* Drag and drop module container */}
        <div
          id="dropzone-detector"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`
            border border-dashed p-6 rounded text-center cursor-pointer transition-all duration-300 relative overflow-hidden
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
              : file 
                ? 'border-emerald-500/40 bg-emerald-950/5' 
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }
          `}
        >
          <input
            id="file-element-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
          />

          {file ? (
            <div className="flex flex-col items-center justify-center">
              <File className="w-8 h-8 text-emerald-400 animate-pulse mb-2" />
              <p className="text-emerald-400 font-bold block select-all text-xs truncate max-w-full px-2">
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · READY_FOR_AIRDROP
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 mb-2 transition-colors duration-300" />
              <p className="text-slate-300 font-bold select-none text-[11px] uppercase tracking-wide">
                Drop files here or click to browse
              </p>
              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                PDFs, Docs, Sheets, Presentations, Images or TXT (Max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Dynamic status notifications */}
        {error && (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded p-3 text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-normal block text-[10px]">
              <span className="font-bold">SYSTEM_CRITICAL:</span> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded p-3 text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-normal block text-[10px]">
              <span className="font-bold">TRANSMISSION_COMPLETE:</span> Classwork safely synchronized to folder vault.
            </div>
          </div>
        )}

        {/* Submit trigger button */}
        <button
          id="airdrop-payload-btn"
          type="submit"
          disabled={isUploading}
          className={`
            w-full py-2.5 rounded text-center font-bold font-mono tracking-wider transition-all duration-300 border flex items-center justify-center gap-2 uppercase
            ${isUploading
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 cursor-not-allowed'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            }
          `}
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Uploading payload...
            </>
          ) : (
            'Airdrop Classwork payload'
          )}
        </button>
      </form>
    </div>
  );
}
