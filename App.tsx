/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { 
  Folder, 
  HardDrive, 
  Gamepad2, 
  Info, 
  Eye, 
  LogOut, 
  Code, 
  AlertTriangle, 
  MonitorPlay,
  Sliders,
  Upload,
  Activity,
  Cpu,
  Layers,
  Terminal,
  RefreshCw
} from 'lucide-react';
import Calendar from './components/Calendar';
import SemesterSelector from './components/SemesterSelector';
import SubjectFolder from './components/SubjectFolder';
import ClassworkUploadForm from './components/ClassworkUploadForm';
import ClassworkList from './components/ClassworkList';
import { Subject, Classwork } from './types';

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classworks, setClassworks] = useState<Classwork[]>([]);
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Mobile active viewpoint selection
  const [mobileTab, setMobileTab] = useState<'vaults' | 'config' | 'upload'>('vaults');

  // Initialize selected date based on today's local date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Client Filter Utilities
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByDate, setFilterByDate] = useState(false);

  // Loading/Sync States
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE');
  const [systemLogs, setSystemLogs] = useState<string>('SYS_BOOT_COMPLETE: ALL INTERFACES NOMINAL.');

  // Fetch initial subjects and classwork payloads
  const fetchData = async () => {
    setSyncStatus('SYNCING');
    try {
      const [subjectsRes, classworksRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/classworks'),
      ]);

      if (!subjectsRes.ok || !classworksRes.ok) {
        throw new Error('CORE_SYS_CONNECTION_ERR');
      }

      const subjectsData = await subjectsRes.json();
      const classworksData = await classworksRes.json();

      setSubjects(subjectsData);
      setClassworks(classworksData);
      setSyncStatus('IDLE');
      setSystemLogs(`DATA_SYNC: Downloaded ${classworksData.length} workloads across ${subjectsData.length} directories.`);
    } catch (err) {
      console.error('Fetch errors: ', err);
      setSyncStatus('ERROR');
      setSystemLogs('CRITICAL_ALERT: CONNECTION TERMINATED WITH CORE BACKEND HOST.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subjects matching currently chosen level/semester Stage
  const activeSemesterSubjects = useMemo(() => {
    return subjects.filter((s) => s.semesterId === currentSemester);
  }, [subjects, currentSemester]);

  // Compute a map of subjectId -> upload counts
  const classworksCountMap = useMemo(() => {
    return classworks.reduce((acc, item) => {
      acc[item.subjectId] = (acc[item.subjectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [classworks]);

  // Handle Level Selected
  const handleSelectSemester = (id: number) => {
    setCurrentSemester(id);
    setActiveSubjectId(null); // Reset subject filter when entering a new stage
    setSystemLogs(`INDEX_STAGE_MAP updated: Stage Stage-0${id} set as active workspace.`);
  };

  // Helper callbacks triggered inline from sub-components
  const handleCreateSubject = async (name: string, code?: string) => {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, semesterId: currentSemester }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'CREATE_VAULT_FAILED');
    }
    const newSubObj = await res.json();
    setSubjects((prev) => [...prev, newSubObj]);
    setSystemLogs(`DIRECTORY_GEN: Created secure vault folder "${newSubObj.name}" in Stage STG-0${currentSemester}.`);
  };

  const handleDeleteSubject = async (id: string) => {
    const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('DELETE_VAULT_FAILED');
    }
    // Update local states
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setClassworks((prev) => prev.filter((c) => c.subjectId !== id));
    setSystemLogs(`DIRECTORY_ANNIHILATION: Vault indices safely expunged from database.`);
  };

  const handleDeleteClasswork = async (id: string) => {
    const res = await fetch(`/api/classworks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('PURGE_CLASSWORK_FAILED');
    }
    setClassworks((prev) => prev.filter((c) => c.id !== id));
    setSystemLogs(`TRANSMISSION_PURGE: Artifact traces wiped from machine drives.`);
  };

  // Global visual stats compute
  const stats = useMemo(() => {
    let totalSize = classworks.reduce((acc, item) => acc + item.fileSize, 0);
    const sizeFormatted = (() => {
      if (totalSize < 1024) return `${totalSize} Bytes`;
      const kb = totalSize / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      const mb = kb / 1024;
      return `${mb.toFixed(1)} MB`;
    })();

    return {
      totalFiles: classworks.length,
      totalSize: sizeFormatted,
      subjectsCount: subjects.length,
    };
  }, [classworks, subjects]);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Upper Retro Navigation Tech Bar */}
      <header className="border-b border-cyan-500/10 bg-[#0a101b]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Glow Title Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-700/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)] select-none">
            <Gamepad2 className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h1 className="font-mono text-sm tracking-widest text-cyan-400 font-bold flex items-center gap-1.5 leading-none">
              CLASSWORK_PORTAL //
              <span className="text-[10px] text-slate-500 font-light select-none tracking-normal">SYS_V1.10</span>
            </h1>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none block mt-1">
              SECURE SECAD DIRECTORY MATRIX
            </span>
          </div>
        </div>

        {/* Live system health indices */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2-h-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 hidden xs:inline">STATUS:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4 sm:pl-6">
            <span className="text-slate-400 hidden xs:inline">DATA_SYNC:</span>
            <button
              id="header-manual-sync-btn"
              onClick={fetchData}
              className={`font-semibold tracking-wider hover:text-cyan-400 transition-colors uppercase ${
                syncStatus === 'SYNCING' ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            >
              {syncStatus}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Gaming Stat Monitor Dashboard Panel - Tailored for view density */}
        <section id="stat-dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 shadow-md">
          <div className="p-3 border-r border-slate-800/60">
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">SYS_WORKSPACE</span>
            <span className="text-xs sm:text-base font-bold text-slate-200 uppercase mt-1 block">LV_0{currentSemester} / STG-{currentSemester}</span>
          </div>
          <div className="p-3 border-r border-slate-800/60">
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">ENCRYPTED_VAULTS</span>
            <span className="text-xs sm:text-base font-bold text-emerald-400 mt-1 block flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 inline" />
              {activeSemesterSubjects.length} <span className="text-[9px] sm:text-[10px] text-slate-600 font-normal hidden xs:inline">({stats.subjectsCount} total)</span>
            </span>
          </div>
          <div className="p-3 lg:border-r border-slate-800/60">
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">SYNCED_PAYLOADS</span>
            <span className="text-xs sm:text-base font-bold text-cyan-400 mt-1 block flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 inline animate-pulse" />
              {stats.totalFiles} <span className="text-[9px] sm:text-[10px] text-slate-600 font-normal hidden xs:inline">uploaded</span>
            </span>
          </div>
          <div className="p-3 hidden lg:block">
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">PAYLOAD_VOLUME</span>
            <span className="text-base font-bold text-purple-400 mt-1 block">{stats.totalSize}</span>
          </div>
          <div className="p-3 lg:hidden block">
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">DEVICE_TARGET</span>
            <span className="text-xs font-bold text-amber-400 mt-1 block uppercase">MOBILE_NODE</span>
          </div>
        </section>

        {loading ? (
          <div id="booting-screen" className="flex flex-col items-center justify-center p-20 space-y-4 font-mono text-xs">
            <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse tracking-widest text-cyan-400 font-bold uppercase">INITIALIZING_METRIC_CONTAINERS...</p>
          </div>
        ) : (
          <>
            {/* ========================================================== */}
            {/* 🖥️ DESKTOP COCKPIT VIEWPORT (Large Screens Only: width >= 1024px) */}
            {/* ========================================================== */}
            <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
              
              {/* Desktop Left Column (Instruments Panel) */}
              <div className="col-span-3 space-y-6">
                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1 uppercase select-none tracking-widest border-b border-slate-800/80 pb-2 mb-2">
                  <Activity className="w-3 h-3 text-cyan-500" />
                  INSTRUMENT_CONTROLS_01
                </div>

                {/* Retro calendar system */}
                <Calendar 
                  selectedDate={selectedDate} 
                  onChange={(d) => {
                    setSelectedDate(d);
                    setSystemLogs(`CALENDAR: Highlight target date changed to ${d}.`);
                  }} 
                />

                {/* level map / Semester layout slider */}
                <SemesterSelector
                  currentSemester={currentSemester}
                  onSelectSemester={handleSelectSemester}
                  subjects={subjects}
                />

                {/* System Interactive Virtual Sine-Wave Sound Device deco */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 font-mono select-none">
                  <div className="flex items-center justify-between text-[10px] mb-2 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      CPU_FREQ_DECODER
                    </span>
                    <span>98.6%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-8 justify-center">
                    <span className="w-1.5 bg-cyan-500/80 rounded animate-pulse h-1/2"></span>
                    <span className="w-1.5 bg-cyan-400/85 rounded animate-pulse h-3/4"></span>
                    <span className="w-1.5 bg-purple-500/80 rounded animate-pulse h-5/6"></span>
                    <span className="w-1.5 bg-cyan-400/90 rounded animate-pulse h-2/3"></span>
                    <span className="w-1.5 bg-purple-400/80 rounded animate-pulse h-4/5"></span>
                    <span className="w-1.5 bg-cyan-500/80 rounded animate-pulse h-2/5"></span>
                  </div>
                </div>
              </div>

              {/* Desktop Middle Column (Active Repository Workspace) */}
              <div className="col-span-6 space-y-6">
                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1 uppercase select-none tracking-widest border-b border-slate-800/80 pb-2 mb-2">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  WORKSPACE_DIRECTORY_02
                </div>

                {/* Subjects Folder Repository Vaults */}
                <SubjectFolder
                  subjects={activeSemesterSubjects}
                  activeSubjectId={activeSubjectId}
                  onSelectSubject={(id) => {
                    setActiveSubjectId(id);
                    const info = id ? `Folder Filter activated.` : `Showing all current Stage-0${currentSemester} archives.`;
                    setSystemLogs(`INDEX_VAULT: ${info}`);
                  }}
                  onCreateSubject={handleCreateSubject}
                  onDeleteSubject={handleDeleteSubject}
                  classworksCountMap={classworksCountMap}
                />

                {/* Secure Workloads Search Catalog/List */}
                <ClassworkList
                  classworks={classworks}
                  subjects={subjects}
                  activeSubjectId={activeSubjectId}
                  selectedDate={selectedDate}
                  currentSemester={currentSemester}
                  onDeleteClasswork={handleDeleteClasswork}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterByDate={filterByDate}
                  onToggleFilterByDate={() => {
                    const newState = !filterByDate;
                    setFilterByDate(newState);
                    setSystemLogs(`DATE_INDEX: Local Date filtering ${newState ? 'Armed' : 'Disarmed'}.`);
                  }}
                />
              </div>

              {/* Desktop Right Column (Airdrop Intake Transceiver Panel) */}
              <div className="col-span-3 space-y-6">
                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1 uppercase select-none tracking-widest border-b border-slate-800/80 pb-2 mb-2">
                  <Upload className="w-3 h-3 text-cyan-400" />
                  AIRDROP_TRANSCEIVER_03
                </div>

                {/* Classwork Upload Terminal */}
                <ClassworkUploadForm
                  selectedDate={selectedDate}
                  currentSemester={currentSemester}
                  subjects={activeSemesterSubjects}
                  activeSubjectId={activeSubjectId}
                  onUploadSuccess={fetchData}
                />

                {/* Desktop Exclusive: Cockpit Hotkeys & Diagnostic readout */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-400">
                  <h4 className="text-cyan-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    COCKPIT_SHELL_AIDS
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center bg-slate-950/60 p-1 px-1.5 rounded">
                      <span>1. STAGE FLOW SELECTOR</span>
                      <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/40 border border-emerald-900 px-1 rounded">1-8 INDX</span>
                    </li>
                    <li className="flex justify-between items-center bg-slate-950/60 p-1 px-1.5 rounded">
                      <span>2. CORESYNC PAYLOADS</span>
                      <span className="text-cyan-400 font-bold text-[10px] bg-cyan-950/40 border border-cyan-900 px-1 rounded">AIRDROP</span>
                    </li>
                    <li className="flex justify-between items-center bg-slate-950/60 p-1 px-1.5 rounded">
                      <span>3. ALL VAULTS TARGET</span>
                      <span className="text-purple-400 font-bold text-[10px] bg-purple-950/40 border border-purple-900 px-1 rounded">RESET</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-slate-500 leading-snug mt-3">
                    Drag and drop PDFs or academic sheets inside the airdrop module to bind to the selected folder instantly.
                  </p>
                </div>
              </div>

            </div>

            {/* ========================================================== */}
            {/* 📱 MOBILE MODULAR VIEWPORT (Medium & Under Devices: width < 1024px) */}
            {/* ========================================================== */}
            <div className="lg:hidden space-y-4">
              
              {/* High-Contrast Segmented Thumb Toggles for Mobile UI */}
              <div className="grid grid-cols-3 bg-slate-950 border border-slate-800/80 p-1 rounded-lg gap-1 select-none sticky top-[72px] z-40 backdrop-blur-md">
                
                {/* Visual Tab 1: Directory Storage */}
                <button
                  id="mobile-tab-vaults"
                  onClick={() => setMobileTab('vaults')}
                  className={`py-2.5 px-2 rounded font-mono text-[11px] uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${
                    mobileTab === 'vaults'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent'
                  }`}
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Vaults & Files</span>
                </button>

                {/* Visual Tab 2: Calibration Settings (Calendar & Stage map) */}
                <button
                  id="mobile-tab-config"
                  onClick={() => setMobileTab('config')}
                  className={`py-2.5 px-2 rounded font-mono text-[11px] uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${
                    mobileTab === 'config'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Stage & Date</span>
                </button>

                {/* Visual Tab 3: Fast Airdrop Upload intake */}
                <button
                  id="mobile-tab-upload"
                  onClick={() => setMobileTab('upload')}
                  className={`py-2.5 px-2 rounded font-mono text-[11px] uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${
                    mobileTab === 'upload'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent'
                  }`}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Airdrop</span>
                </button>

              </div>

              {/* Viewport Render depending on Segment selection */}
              
              {/* Mobile View: Directories & Search Archives */}
              {mobileTab === 'vaults' && (
                <div className="space-y-4">
                  {/* Active Semester Header Banner for mobile clarity */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-[11px] font-mono flex items-center justify-between text-slate-300">
                    <span className="uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Active: Sem {currentSemester}
                    </span>
                    <span className="text-slate-500 uppercase">
                      Change Stage in &quot;Stage &amp; Date&quot;
                    </span>
                  </div>

                  {/* Subject folders */}
                  <SubjectFolder
                    subjects={activeSemesterSubjects}
                    activeSubjectId={activeSubjectId}
                    onSelectSubject={(id) => {
                      setActiveSubjectId(id);
                      setSystemLogs(`INDEX_VAULT: Filter set via mobile viewport.`);
                    }}
                    onCreateSubject={handleCreateSubject}
                    onDeleteSubject={handleDeleteSubject}
                    classworksCountMap={classworksCountMap}
                  />

                  {/* File records search & streaming downloads list */}
                  <ClassworkList
                    classworks={classworks}
                    subjects={subjects}
                    activeSubjectId={activeSubjectId}
                    selectedDate={selectedDate}
                    currentSemester={currentSemester}
                    onDeleteClasswork={handleDeleteClasswork}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterByDate={filterByDate}
                    onToggleFilterByDate={() => {
                      const newState = !filterByDate;
                      setFilterByDate(newState);
                      setSystemLogs(`DATE_INDEX: Mobile Local Date filtering changed.`);
                    }}
                  />
                </div>
              )}

              {/* Mobile View: Calendar Calibration & Stage Selector */}
              {mobileTab === 'config' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[10px] font-mono text-center tracking-widest text-slate-500 uppercase [word-spacing:4px]">
                    SELECT WORKPLACE STAGE AND DATE ANCHOR FOR CLASSWORKS
                  </div>

                  {/* Level map Semester slider */}
                  <SemesterSelector
                    currentSemester={currentSemester}
                    onSelectSemester={(semId) => {
                      handleSelectSemester(semId);
                      // Auto route user back to view files after selecting stage
                      setMobileTab('vaults');
                    }}
                    subjects={subjects}
                  />

                  {/* Retro calendar system */}
                  <Calendar 
                    selectedDate={selectedDate} 
                    onChange={(d) => {
                      setSelectedDate(d);
                      setSystemLogs(`CALENDAR: Date set: ${d}.`);
                      // Direct back to lists with date filter turned on to show records
                      setFilterByDate(true);
                      setMobileTab('vaults');
                    }} 
                  />
                </div>
              )}

              {/* Mobile View: Quick Airdrop Transceiver */}
              {mobileTab === 'upload' && (
                <div className="space-y-4">
                  {/* Mini summary for mobile user upload path */}
                  <div className="bg-cyan-950/20 border border-cyan-500/10 rounded p-3 text-[11px] font-mono text-cyan-300">
                    <span className="font-bold">Fast Upload Port:</span> Choosing a directory below will bound the file to that workspace instantly. Supported formats: PDFs, Docs, Sheets, images.
                  </div>

                  <ClassworkUploadForm
                    selectedDate={selectedDate}
                    currentSemester={currentSemester}
                    subjects={activeSemesterSubjects}
                    activeSubjectId={activeSubjectId}
                    onUploadSuccess={() => {
                      fetchData();
                      // Auto route back to folder lists view to witness the upload file
                      setMobileTab('vaults');
                    }}
                  />
                </div>
              )}

            </div>
          </>
        )}
      </main>

      {/* Cyber System Logs Status Footer */}
      <footer className="border-t border-slate-900 bg-[#05080d] p-4 mt-auto font-mono text-[10px]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
            <span className="shrink-0 bg-slate-950 border border-slate-800 text-[9px] text-cyan-400 font-semibold px-1.5 py-0.5 rounded tracking-widest uppercase">SYSLOG</span>
            <span className="truncate text-slate-400 select-all font-mono uppercase">{systemLogs}</span>
          </div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest shrink-0">
            SECURE DIRECTORY PORTAL · DEV_PLATFORM // 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
