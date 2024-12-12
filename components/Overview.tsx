"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  CompositeChart,
  ResponsiveContainer,
} from "recharts"
import { DateRange } from 'react-day-picker'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { subMonths } from 'date-fns'

interface OverviewProps {
  currency: string;
  categoryId?: string;
  dateRange?: DateRange;
}

interface MonthlySales {
  month: string;
  total: number;
  count: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function Overview({ currency, categoryId, dateRange }: OverviewProps) {
  const [data, setData] = useState<MonthlySales[]>([])
  const [comparisonData, setComparisonData] = useState<MonthlySales[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMonthlySales() {
      try {
        setError(null);
        setLoading(true);
        const { data: sales, error: apiError } = await supabase
          .rpc('get_monthly_category_sales', {
            category_id: categoryId,
            start_date: dateRange?.from?.toISOString(),
            end_date: dateRange?.to?.toISOString()
          })

        if (apiError) throw apiError;
        setData(sales || []);
      } catch (err) {
        console.error('Failed to fetch monthly sales:', err);
        setError('Failed to load sales data');
      } finally {
        setLoading(false);
      }
    }

    fetchMonthlySales();
  }, [categoryId, dateRange]);

  useEffect(() => {
    if (showComparison) {
      fetchComparisonData()
    }
  }, [showComparison, categoryId, dateRange])

  const fetchComparisonData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const previousFrom = subMonths(dateRange.from, 12)
    const previousTo = subMonths(dateRange.to, 12)
    
    try {
      const { data: sales } = await supabase.rpc('get_monthly_category_sales', {
        category_id: categoryId,
        start_date: previousFrom.toISOString(),
        end_date: previousTo.toISOString()
      })
      
      setComparisonData(sales || [])
    } catch (error) {
      console.error('Failed to fetch comparison data:', error)
    }
  }

  if (error) {
    return (
      <div className="h-[350px] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center space-y-4">
        <div className="w-full space-y-4">
          <div className="h-8 bg-gray-800/50 animate-pulse rounded" />
          <div className="h-[300px] bg-gray-800/50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? 'Hide' : 'Show'} Year-over-Year
        </Button>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer>
          <CompositeChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={(props) => <CustomTooltip {...props} currency={currency} />} />
            <Legend />
            <Bar
              dataKey="total"
              fill="#adfa1d"
              name="Revenue"
              radius={[4, 4, 0, 0]}
            />
            {showComparison && comparisonData.length > 0 && (
              <Line
                type="monotone"
                dataKey="total"
                data={comparisonData}
                stroke="#888888"
                name="Previous Year"
                dot={false}
              />
            )}
          </CompositeChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, currency }: TooltipProps & { currency: string }) {
  if (!active || !payload?.length) return null
  
  return (
    <Card className="p-3 bg-background border shadow-lg">
      <p className="font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-medium">
            {currency}{entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </Card>
  )
}

