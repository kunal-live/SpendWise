import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function DatePicker({ value, onChange }: { value: string, onChange: (date: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  // Parse incoming YYYY-MM-DD string to date
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  });
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handleSelectDate = (e: React.MouseEvent, day: number) => {
    e.preventDefault();
    const yyyy = currentMonth.getFullYear();
    const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayStr = new Date().toLocaleDateString('en-CA'); // roughly YYYY-MM-DD

  return (
    <div className="relative" ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-3 text-sm text-[#F6F2EB] outline-none hover:border-[#E07A28] hover:bg-[#1D1815] transition-all"
      >
        <span>{value || "Select a date"}</span>
        <CalendarIcon size={16} className="text-[#8C8176]" />
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 w-[280px] rounded-2xl border border-[#382D25] bg-[#1D1815] p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <select 
              value={currentMonth.getMonth()} 
              onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}
              className="w-full cursor-pointer rounded-lg border border-[#382D25] bg-[#26201B] px-2 py-1.5 text-sm font-bold text-[#F6F2EB] outline-none hover:bg-[#28211B] focus:ring-1 focus:ring-[#E07A28]"
            >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}
              className="w-full cursor-pointer rounded-lg border border-[#382D25] bg-[#26201B] px-2 py-1.5 text-sm font-bold text-[#F6F2EB] outline-none hover:bg-[#28211B] focus:ring-1 focus:ring-[#E07A28]"
            >
              {Array.from({length: 120}).map((_, i) => {
                const year = new Date().getFullYear() - 100 + i;
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#8C8176]">
            {days.map(d => <div key={d} className="w-8 py-1">{d}</div>)}
          </div>
          
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const yyyy = currentMonth.getFullYear();
              const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;
              
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;
              
              return (
                <button
                  key={day}
                  onClick={(e) => handleSelectDate(e, day)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors ${
                    isSelected 
                      ? "bg-[#E07A28] text-white font-bold" 
                      : isToday 
                        ? "bg-[#26201B] text-[#E07A28] font-bold border border-[#E07A28]/40" 
                        : "text-[#C6BCB3] hover:bg-[#28211B] hover:text-[#F6F2EB]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
