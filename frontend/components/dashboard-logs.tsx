"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DoorLog as DoorLogComponent } from "@/components/door-log"
import { ClotheslineLog as ClotheslineLogComponent } from "@/components/clothesline-log"
import { LightLog as LightLogComponent } from "@/components/light-log"
import { LightUsageChart } from "@/components/light-usage-chart"
import { DoorOpen, Shirt, Lightbulb, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

const LOGS_PER_PAGE = 10

// Define reusable log entry types
interface LogEntry {
  id: number
  user: string
  action: string
  timestamp: Date
  source: string
}

interface LightLogEntry {
  id: number
  user: string
  action: string
  light: string
  timestamp: Date
}

interface LightUsageEntry {
  hour: string
  light1: number
  light2: number
  light3: number
}

interface RawLog {
  id?: number
  user: string
  action: string
  timestamp: string
  source?: string
  light?: string
  light_id?: string | number
}

interface RawLightUsage {
  hour: string
  light1?: number
  light2?: number
  light3?: number
}

export function DashboardLogs() {
  const { token } = useAuth()
  const [doorLogs, setDoorLogs] = useState<LogEntry[]>([])
  const [doorTotal, setDoorTotal] = useState(0)
  const [doorPage, setDoorPage] = useState(1)

  const [clotheslineLogs, setClotheslineLogs] = useState<LogEntry[]>([])
  const [clotheslineTotal, setClotheslineTotal] = useState(0)
  const [clotheslinePage, setClotheslinePage] = useState(1)

  const [lightLogs, setLightLogs] = useState<LightLogEntry[]>([])
  const [lightTotal, setLightTotal] = useState(0)
  const [lightPage, setLightPage] = useState(1)

  const [lightUsageData, setLightUsageData] = useState<LightUsageEntry[]>([])
  const [loadingLightUsage, setLoadingLightUsage] = useState(false)

  const [activeTab, setActiveTab] = useState("door")
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const tabsListRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({
    door: null,
    clothesline: null,
    light: null,
    lightUsage: null,
  })

  // Fetch Door Logs
  useEffect(() => {
    if (!token) return
    const url = `/api/logs/door?page=${doorPage}&limit=${LOGS_PER_PAGE}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const logs: LogEntry[] = data.logs.map((log: RawLog, i: number) => ({
          id: log.id ?? i + 1,
          user: log.user,
          action: log.action,
          timestamp: new Date(log.timestamp),
          source: log.source ?? "",
        }))
        setDoorLogs(logs)
        setDoorTotal(data.total)
      })
  }, [doorPage, token])

  // Fetch Clothesline Logs
  useEffect(() => {
    if (!token) return
    const url = `/api/logs/clothesline?page=${clotheslinePage}&limit=${LOGS_PER_PAGE}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const logs: LogEntry[] = data.logs.map((log: RawLog, i: number) => ({
          id: log.id ?? i + 1,
          user: log.user,
          action: log.action,
          timestamp: new Date(log.timestamp),
          source: log.source ?? "",
        }))
        setClotheslineLogs(logs)
        setClotheslineTotal(data.total)
      })
  }, [clotheslinePage, token])

  // Fetch Light Logs
  useEffect(() => {
    if (!token) return
    const url = `/api/logs/light?page=${lightPage}&limit=${LOGS_PER_PAGE}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const logs: LightLogEntry[] = data.logs.map((log: RawLog, i: number) => ({
          id: log.id ?? i + 1,
          user: log.user,
          action: log.action,
          light: log.light_id ? `Light ${log.light_id}` : log.light ?? "",
          timestamp: new Date(log.timestamp),
        }))
        setLightLogs(logs)
        setLightTotal(data.total)
      })
  }, [lightPage, token])

  // Fetch Light Usage Chart Data
  useEffect(() => {
    if (activeTab !== "lightUsage" || !token) return

    setLoadingLightUsage(true)
    fetch("/api/light-usage/hourly", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const chartData: LightUsageEntry[] = data.data.map((item: RawLightUsage) => ({
          hour: item.hour,
          light1: item.light1 ?? 0,
          light2: item.light2 ?? 0,
          light3: item.light3 ?? 0,
        }))
        setLightUsageData(chartData)
      })
      .finally(() => setLoadingLightUsage(false))
  }, [activeTab, token])

  // Tab indicator animation logic
  useEffect(() => {
    const updateIndicator = () => {
      const currentTrigger = triggerRefs.current[activeTab]
      if (currentTrigger && tabsListRef.current) {
        const tabsListRect = tabsListRef.current.getBoundingClientRect()
        const triggerRect = currentTrigger.getBoundingClientRect()
        setIndicatorStyle({
          left: `${triggerRect.left - tabsListRect.left}px`,
          width: `${triggerRect.width}px`,
          height: `${triggerRect.height}px`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        })
      }
    }
    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [activeTab])

  return (
    <div>
      <Tabs defaultValue="door" onValueChange={setActiveTab} className="w-full">
        <TabsList
          ref={tabsListRef}
          className="mb-6 w-fit justify-start bg-solid-muted dark:bg-solid-text-secondary/20 p-1 rounded-xl overflow-hidden relative"
        >
          <div
            className="absolute bg-[#4C7380] rounded-lg z-0 transition-all duration-300 ease-in-out"
            style={indicatorStyle}
          />
          {[
            { key: "door", label: "Door", icon: DoorOpen },
            { key: "clothesline", label: "Clothesline", icon: Shirt },
            { key: "light", label: "Light", icon: Lightbulb },
            { key: "lightUsage", label: "Light Usage", icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <TabsTrigger
              key={key}
              ref={(el) => {
                triggerRefs.current[key] = el
              }}
              value={key}
              className="data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-300 ease-in-out rounded-lg flex items-center gap-2 py-2 px-4 relative z-10 hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setActiveTab(key)}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors duration-300",
                  activeTab === key ? "text-white" : "text-[#4C7380]"
                )}
              />
              <span
                className={cn(
                  "transition-transform duration-300",
                  activeTab === key ? "transform scale-105" : ""
                )}
              >
                {label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="door">
          <DoorLogComponent
            logs={doorLogs}
            currentPage={doorPage - 1}
            total={doorTotal}
            onPageChange={page => setDoorPage(page + 1)}
          />
        </TabsContent>
        <TabsContent value="clothesline">
          <ClotheslineLogComponent
            logs={clotheslineLogs}
            currentPage={clotheslinePage - 1}
            total={clotheslineTotal}
            onPageChange={page => setClotheslinePage(page + 1)}
          />
        </TabsContent>
        <TabsContent value="light">
          <LightLogComponent
            logs={lightLogs}
            currentPage={lightPage - 1}
            total={lightTotal}
            onPageChange={page => setLightPage(page + 1)}
          />
        </TabsContent>
        <TabsContent value="lightUsage">
          {loadingLightUsage ? (
            <div className="py-8 text-center text-solid-text-secondary">Loading...</div>
          ) : (
            <div>
              <LightUsageChart data={lightUsageData} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
