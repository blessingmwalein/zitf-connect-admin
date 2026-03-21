"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const dateValue = value ? new Date(value) : undefined;
  const timeStr =
    dateValue && isValid(dateValue) ? format(dateValue, "HH:mm") : "";

  function handleDateSelect(day: Date | undefined) {
    if (!day) return;
    const hours = dateValue && isValid(dateValue) ? dateValue.getHours() : 9;
    const minutes = dateValue && isValid(dateValue) ? dateValue.getMinutes() : 0;
    day.setHours(hours, minutes, 0, 0);
    onChange(format(day, "yyyy-MM-dd'T'HH:mm"));
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = e.target.value;
    if (!time) return;
    const base = dateValue && isValid(dateValue) ? dateValue : new Date();
    const parsed = parse(time, "HH:mm", base);
    if (isValid(parsed)) {
      onChange(format(parsed, "yyyy-MM-dd'T'HH:mm"));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn(
              "h-9 w-full justify-start rounded-xl text-left font-normal",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        {dateValue && isValid(dateValue) ? (
          <span>{format(dateValue, "MMM d, yyyy  HH:mm")}</span>
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          className="p-3"
        />
        <div className="border-t px-3 py-2">
          <label className="text-caption-1 text-muted-foreground">Time</label>
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="mt-1 h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
