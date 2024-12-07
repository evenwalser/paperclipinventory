"use client"

import { useState } from "react"
import { DateRange } from "react-day-picker"
import { CalendarDateRangePicker } from "@/components/date-range-picker"

export default function DashboardPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  return (
    <div>
      <CalendarDateRangePicker 
        date={date} 
        onDateChange={setDate}
      />
      {/* Rest of your dashboard content */}
    </div>
  )
} 