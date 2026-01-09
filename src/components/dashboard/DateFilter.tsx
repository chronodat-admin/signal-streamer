import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [customRange, setCustomRange] = useState<DateRange>(dateRange || { from: undefined, to: undefined });
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePresetChange = (preset: DateFilterType) => {
    if (preset === 'custom') {
      // Set filter to 'custom' immediately so the calendar button renders
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
      if (range.from && range.to) {
        onFilterChange('custom', range);
        setIsCustomOpen(false);
      }
    }
  };

  const getDisplayText = () => {
    switch (value) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
        }
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{getDisplayText()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
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
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{
                from: customRange.from,
                to: customRange.to,
              }}
              onSelect={(range) => {
                if (range) {
                  handleCustomRangeSelect({
                    from: range.from,
                    to: range.to,
                  });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

