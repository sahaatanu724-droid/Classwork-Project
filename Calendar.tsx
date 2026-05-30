/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Cpu } from 'lucide-react';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export default function Calendar({ selectedDate, onChange }: CalendarProps) {
  const parsedDate = useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  // Track the month/year currently viewing in the monthly grid
  const [viewState, setViewState] = useState({
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth(), // 0-indexed
  });

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  // Helper to change months
  const adjustMonth = (delta: number) => {
    setViewState((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      return { year: newYear, month: newMonth };
    });
  };

  // Generate calendar days
  const calendarGrid = useMemo(() => {
    const { year, month } = viewState;
    // First day of the month
    const firstDay = new Date(year, month, 1).getDay();
    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateString: string;
    }> = [];

    // Pads of previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: prevDay,
        isCurrentMonth: false,
        dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month padding to fill grid (multiple of 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return days;
  }, [viewState]);

  // Set to today's date
  const setToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange(todayStr);
    setViewState({
      year: today.getFullYear(),
      month: today.getMonth(),
    });
  };

  const dayLabels = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  return (
    <div id="calendar-widget" className="relative bg-slate-900/90 border border-cyan-500/30 p-5 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md overflow-hidden">
      {/* Decors / Gaming vibe scanner lines */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70 animate-pulse"></div>
      
      {/* Header section with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="font-mono text-sm tracking-widest text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="inline-block w-2-h-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            CHRONO_INDEX: {monthNames[viewState.month]} {viewState.year}
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 border border-slate-800 rounded">
          <button
            id="prev-month-btn"
            onClick={() => adjustMonth(-1)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="PREVIOUS INDEX"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="today-btn"
            onClick={setToday}
            className="px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors rounded uppercase"
          >
            NOW
          </button>
          <button
            id="next-month-btn"
            onClick={() => adjustMonth(1)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="NEXT INDEX"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayLabels.map((lbl) => (
          <div key={lbl} className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider py-1 border-b border-slate-800">
            {lbl}
          </div>
        ))}
      </div>

      {/* Monthly Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map(({ day, isCurrentMonth, dateString }) => {
          const isSelected = dateString === selectedDate;
          const isTodayDate = (() => {
            const t = new Date();
            const year = t.getFullYear();
            const month = String(t.getMonth() + 1).padStart(2, '0');
            const date = String(t.getDate()).padStart(2, '0');
            return dateString === `${year}-${month}-${date}`;
          })();

          return (
            <button
              id={`cal-day-${dateString}`}
              key={dateString}
              onClick={() => onChange(dateString)}
              className={`
                group relative aspect-square flex flex-col items-center justify-center rounded font-mono text-xs transition-all duration-200 border
                ${isSelected 
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] font-bold scale-105 z-10' 
                  : isCurrentMonth
                    ? 'border-slate-800/40 text-slate-300 hover:border-cyan-400/50 hover:bg-slate-800/60'
                    : 'border-transparent text-slate-600 hover:border-slate-800'
                }
              `}
            >
              {day}
              {/* Active dots/pins */}
              {isTodayDate && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]"></span>
              )}
              {isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              )}
              
              {/* Corner decor active indicators for gaming feel */}
              {isSelected && (
                <>
                  <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-cyan-300"></span>
                  <span className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r border-cyan-300"></span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar diagnostic / metadata readout */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-500" />
          SYS_DATE: {selectedDate}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          SELECT DATE FOR WORKLOADS
        </span>
      </div>
    </div>
  );
}
