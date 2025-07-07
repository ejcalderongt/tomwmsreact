import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  className
}: DateRangeFilterProps) {
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleStartDateSelect = (date?: Date) => {
    onDateChange(date, endDate);
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (date?: Date) => {
    onDateChange(startDate, date);
    setShowEndCalendar(false);
  };

  const clearFilters = () => {
    onDateChange(undefined, undefined);
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor="start-date" className="text-sm font-medium">
          Desde:
        </Label>
        <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
          <PopoverTrigger asChild>
            <Button
              id="start-date"
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "dd/MM/yyyy", { locale: es })
              ) : (
                "Seleccionar fecha"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              disabled={(date) =>
                date > new Date() || (endDate && date > endDate)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="end-date" className="text-sm font-medium">
          Hasta:
        </Label>
        <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
          <PopoverTrigger asChild>
            <Button
              id="end-date"
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "dd/MM/yyyy", { locale: es })
              ) : (
                "Seleccionar fecha"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) =>
                date > new Date() || (startDate && date < startDate)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {(startDate || endDate) && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}