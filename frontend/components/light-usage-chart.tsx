"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface LightUsageChartProps {
  data: { hour: string, light1: number, light2: number, light3: number }[]
}

export function LightUsageChart({ data }: LightUsageChartProps) {
  return (
    <Card className="mt-6 border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover">
      <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
          <Lightbulb className="h-5 w-5 text-[#4C7380]" />
          Light Usage Duration per Hour
        </CardTitle>
        <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
          Total ON duration (minutes) per hour, last 8 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-solid-surface dark:bg-solid-text">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
              <YAxis
                label={{ value: "Minutes ON", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
                domain={[0, 60]}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="light1" name="Living Room" fill="#5887DA" />
              <Bar dataKey="light2" name="Bedroom" fill="#C3B1E1" />
              <Bar dataKey="light3" name="Terrace" fill="#C1E1C1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

