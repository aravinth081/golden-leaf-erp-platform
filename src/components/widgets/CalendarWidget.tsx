import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

export const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const resetToToday = () => setCurrentDate(today);

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="w-[min(92vw,320px)] max-w-full bg-white rounded-2xl shadow-modal border border-surface-muted overflow-hidden flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gold-600 mb-0.5">
            {format(currentDate, 'yyyy')}
          </span>
          <h2 className="text-lg font-display font-semibold text-rich-black leading-none">
            {format(currentDate, 'MMMM')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={prevMonth}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-rich-silver hover:bg-surface-cream hover:text-rich-black transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={resetToToday}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gold-600 hover:bg-gold-50 transition-colors cursor-pointer"
            title="Go to Today"
            aria-label="Current Month"
          >
            <CalendarIcon size={16} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-rich-silver hover:bg-surface-cream hover:text-rich-black transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-center text-[10px] font-bold text-rich-silver">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const isToday = isSameDay(date, today);
          const isCurrentMonth = isSameMonth(date, currentDate);
          
          return (
            <div
              key={i}
              className={clsx(
                "h-8 flex items-center justify-center text-sm rounded-lg transition-colors cursor-default",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && !isToday && "text-rich-black hover:bg-[#F8F9FA]",
                isToday && "bg-gold-600 text-white font-bold shadow-sm"
              )}
            >
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
      
      {/* Footer / Today summary */}
      <div className="mt-4 pt-3 border-t border-surface-muted flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-gold-600"></div>
         <p className="text-xs font-medium text-rich-black">
           Today is {format(today, 'EEEE, MMM do')}
         </p>
      </div>
    </div>
  );
};
