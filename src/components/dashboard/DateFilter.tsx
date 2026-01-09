import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterProps {
  value: DateFilterType;
  dateRange?: DateRange;
  onFilterChange: (filter: DateFilterType, range?: DateRange) => void;
}

export const DateFilter = ({ value, dateRange, onFilterChange }: DateFilterProps) => {
  const { t } = useLanguage();
  const [customRange, setCustomRange] = useState<DateRange>(dateRange || { from: undefined, to: undefined });
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Sync customRange with dateRange prop
  useEffect(() => {
    if (dateRange) {
      setCustomRange(dateRange);
    }
  }, [dateRange]);

  // Auto-open popover when custom is selected without a range
  useEffect(() => {
    if (value === 'custom' && (!dateRange?.from || !dateRange?.to)) {
      setIsCustomOpen(true);
    }
  }, [value, dateRange]);

  const handlePresetChange = (preset: DateFilterType) => {
    if (preset === 'custom') {
      // First update the value to 'custom' so the calendar button appears
      onFilterChange('custom', customRange.from && customRange.to ? customRange : undefined);
      setIsCustomOpen(true);
    } else {
      onFilterChange(preset);
      setIsCustomOpen(false);
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      setCustomRange(range);
      // Only close and apply when both dates are selected
      if (range.from && range.to) {
        onFilterChange('custom', range);
        setIsCustomOpen(false);
      } else if (range.from) {
        // Keep updating with partial selection
        setCustomRange({ from: range.from, to: undefined });
      }
    }
  };

  const getDisplayText = () => {
    switch (value) {
      case 'today':
        return t.dateFilter.today;
      case 'week':
        return t.dateFilter.thisWeek;
      case 'month':
        return t.dateFilter.thisMonth;
      case 'year':
        return t.dateFilter.thisYear;
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
        }
        return t.dateFilter.customRange;
      default:
        return t.dateFilter.allTime;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{getDisplayText()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.dateFilter.allTime}</SelectItem>
          <SelectItem value="today">{t.dateFilter.today}</SelectItem>
          <SelectItem value="week">{t.dateFilter.thisWeek}</SelectItem>
          <SelectItem value="month">{t.dateFilter.thisMonth}</SelectItem>
          <SelectItem value="year">{t.dateFilter.thisYear}</SelectItem>
          <SelectItem value="custom">{t.dateFilter.customRange}</SelectItem>
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>{t.dateFilter.pickDateRange}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange.from || new Date()}
              selected={{
                from: customRange.from,
                to: customRange.to,
              }}
              onSelect={(range) => {
                handleCustomRangeSelect({
                  from: range?.from,
                  to: range?.to,
                });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

