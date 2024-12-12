'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { LineChart, BarChart } from '@/components/ui/charts'

interface CategoryMetrics {
  revenue: number;
  units: number;
  avgDaysToSale: number;
  turnoverRate: number;
  trendData: {
    date: string;
    value: number;
  }[];
}

export function CategoryPerformance() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() })
  const [metrics, setMetrics] = useState<CategoryMetrics | null>(null)

  useEffect(() => {
    if (selectedCategory && dateRange) {
      fetchCategoryMetrics(selectedCategory, dateRange)
    }
  }, [selectedCategory, dateRange])

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <CategorySelector 
          value={selectedCategory} 
          onChange={setSelectedCategory} 
        />
        <DateRangePicker 
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsCard
          title="Sales Velocity"
          value={metrics?.turnoverRate}
          trend={calculateTrend(metrics?.trendData)}
        />
        <MetricsCard
          title="Average Days to Sale"
          value={metrics?.avgDaysToSale}
          trend={calculateTrend(metrics?.trendData)}
        />
      </div>

      <Card>
        <LineChart 
          data={metrics?.trendData} 
          xAxis="date"
          yAxis="value"
          title="Sales Trend"
        />
      </Card>
    </div>
  )
} 