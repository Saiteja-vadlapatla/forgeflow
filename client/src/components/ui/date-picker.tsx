import * as React from "react";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SelectSingleEventHandler } from "react-day-picker";

export interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  "data-testid": testId,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect: SelectSingleEventHandler = (selectedDate) => {
    if (selectedDate && isValid(selectedDate)) {
      onSelect?.(selectedDate);
      setOpen(false);
    } else if (!selectedDate) {
      onSelect?.(undefined);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && isValid(date) ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePickerProps {
  dateRange?: { from?: Date; to?: Date };
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function DateRangePicker({
  dateRange,
  onSelect,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  "data-testid": testId,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    onSelect?.(range);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return placeholder;
    }
    if (dateRange.to) {
      return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`;
    }
    return format(dateRange.from, "LLL dd, y");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}