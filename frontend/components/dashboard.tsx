"use client"

import { useState, useEffect, useRef } from "react"
import { Home, BarChart3, X, Coffee, LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { DashboardControls } from "@/components/dashboard-controls"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface LightStateEntry {
  user: string
  action: "on" | "off"
  light_id: number
  timestamp: Date
}

interface DoorStateEntry {
  user: string
  action: "open" | "close"
  timestamp: Date
}

interface ClotheslineStateEntry {
  user: string
  action: "extend" | "retract"
  timestamp: Date
}

interface DeviceUpdate {
  user: string
  action: string
  timestamp: Date
}

interface DeviceUpdates {
  lights: DeviceUpdate[]
  door: DeviceUpdate
  clothesline: DeviceUpdate
}


export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [lights, setLights] = useState([false, false, false])
  const [doorOpen, setDoorOpen] = useState(false)
  const [clotheslineExtended, setClotheslineExtended] = useState(false)
  const [clotheslineManualMode, setClotheslineMode] = useState(false)
  const [deviceUpdates, setDeviceUpdates] = useState<DeviceUpdates | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const { name, email, logout, isInitialized } = useAuth()
  const router = useRouter()

  const sidebarRef = useRef<HTMLElement>(null)

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Set sidebar open by default on desktop
  useEffect(() => {
    setIsSidebarOpen(!isMobile)
    setSidebarVisible(!isMobile)
  }, [isMobile])

  // Handle sidebar animation
  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarVisible(true)
    } else if (isMobile) {
      const timer = setTimeout(() => {
        setSidebarVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isSidebarOpen, isMobile])

  // Add transition end listener to handle visibility
  useEffect(() => {
    const sidebar = sidebarRef.current
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "transform" && !isSidebarOpen && isMobile) {
        setSidebarVisible(false)
      }
    }
    if (sidebar) {
      sidebar.addEventListener("transitionend", handleTransitionEnd)
      return () => sidebar.removeEventListener("transitionend", handleTransitionEnd)
    }
  }, [isSidebarOpen, isMobile])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  function setupWebSocketWithReconnect<T>(
    url: string,
    onMessage: (data: T) => void,
    maxDelay = 30000
  ): () => void {
    let ws: WebSocket
    let reconnectTimeout: NodeJS.Timeout
    let attempt = 0

    const connect = () => {
      ws = new WebSocket(url)
      ws.onopen = () => {
        console.log("WebSocket connected:", url)
        attempt = 0
      }
      ws.onmessage = (event) => {
        try {
          const data: T = JSON.parse(event.data)
          onMessage(data)
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err)
        }
      }
      ws.onerror = (err) => {
        console.error("WebSocket error:", err)
      }
      ws.onclose = () => {
        attempt++
        const delay = Math.min(1000 * Math.pow(2, attempt), maxDelay)
        console.warn(`WebSocket closed. Reconnecting in ${delay / 1000}s...`)
        reconnectTimeout = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      ws?.close()
    }
  }

  // useEffect for fetching initial state
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const [lightRes, doorRes, clotheslineRes] = await Promise.all([
          fetch("/api/latest-state/light"),
          fetch("/api/latest-state/door"),
          fetch("/api/latest-state/clothesline"),
        ])
        if (!lightRes.ok || !doorRes.ok || !clotheslineRes.ok) {
          throw new Error("Failed to fetch one or more device states")
        }

        const [lightData, doorData, clotheslineData]: [
          { lights: LightStateEntry[] },
          DoorStateEntry,
          ClotheslineStateEntry
        ] = await Promise.all([
          lightRes.json(),
          doorRes.json(),
          clotheslineRes.json(),
        ])

        const lightState: boolean[] = [false, false, false]
        const lightUpdates: DeviceUpdate[] = []

        lightData.lights.forEach((log) => {
          const index = log.light_id - 1
          lightState[index] = log.action === "on"
          lightUpdates[index] = {
            user: log.user,
            action: log.action === "on" ? "turned on" : "turned off",
            timestamp: new Date(log.timestamp),
          }
        })

        setLights(lightState)

        const updates: DeviceUpdates = {
          lights: lightUpdates.filter(Boolean),
          door: {
            user: doorData.user,
            action: doorData.action,
            timestamp: new Date(doorData.timestamp),
          },
          clothesline: {
            user: clotheslineData.user,
            action: clotheslineData.action,
            timestamp: new Date(clotheslineData.timestamp),
          },
        }

        setDoorOpen(doorData.action === "open")
        setClotheslineExtended(clotheslineData.action === "extend")
        setDeviceUpdates(updates)
        setClotheslineMode(false)

        await fetch("/api/sync-state", { method: "POST" })
      } catch (error) {
        console.error("Failed to fetch initial device state:", error)
      }
    }

    fetchInitialState()
  }, [])

  // WebSocket for alerts
  useEffect(() => {
    type AlertMessage = { user: string; action: "open" | "close"; timestamp: string }

    const cleanup = setupWebSocketWithReconnect<AlertMessage>(
      `${window.location.origin.replace(/^http/, "ws")}/ws/alert`,
      (data) => {
        alert(`Alert: Someone tried to ${data.action} the door!`)
      }
    )
    return cleanup
  }, [])

  // WebSocket for light activity
  useEffect(() => {
    const cleanup = setupWebSocketWithReconnect<LightStateEntry>(
      `${window.location.origin.replace(/^http/, "ws")}/ws/light`,
      (data) => {
        const index = data.light_id - 1
        setLights((prev) => {
          const updated = [...prev]
          updated[index] = data.action === "on"
          return updated
        })
        setDeviceUpdates((prev) => {
          const safePrev = prev ?? {
            lights: [],
            door: { user: "", action: "", timestamp: new Date() },
            clothesline: { user: "", action: "", timestamp: new Date() },
          }
          const newLights = [...safePrev.lights]
          newLights[index] = {
            user: data.user,
            action: data.action === "on" ? "turned on" : "turned off",
            timestamp: new Date(data.timestamp),
          }
          return {
            ...safePrev,
            lights: newLights,
          }
        })
      }
    )
    return cleanup
  }, [])

  // WebSocket for door activity
  useEffect(() => {
    const cleanup = setupWebSocketWithReconnect<DoorStateEntry>(
      `${window.location.origin.replace(/^http/, "ws")}/ws/door`,
      (data) => {
        const isOpen = data.action === "open"
        setDoorOpen(isOpen)
        setDeviceUpdates((prev) => ({
          lights: prev?.lights ?? [],
          door: {
            user: data.user,
            action: data.action,
            timestamp: new Date(data.timestamp),
          },
          clothesline: prev?.clothesline ?? { user: "", action: "", timestamp: new Date() },
        }))
      }
    )
    return cleanup
  }, [])

  // WebSocket for clothesline activity
  useEffect(() => {
    const cleanup = setupWebSocketWithReconnect<ClotheslineStateEntry>(
      `${window.location.origin.replace(/^http/, "ws")}/ws/clothesline`,
      (data) => {
        const isExtended = data.action === "extend"
        setClotheslineExtended(isExtended)
        setDeviceUpdates((prev) => ({
          lights: prev?.lights ?? [],
          door: prev?.door ?? { user: "", action: "", timestamp: new Date() },
          clothesline: {
            user: data.user,
            action: data.action,
            timestamp: new Date(data.timestamp),
          },
        }))
      }
    )
    return cleanup
  }, [])

  const toggleSidebar = () => {
    if (!isSidebarOpen) {
      setSidebarVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsSidebarOpen(true)
        })
      })
    } else {
      setIsSidebarOpen(false)
    }
  }

  const toggleLight = (index: number) => {
    const newState = !lights[index]
    const action = newState ? "on" : "off"
    const lightId = index + 1
    fetch(`/api/light/${lightId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: name, action }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to toggle light")
        return res.json()
      })
      .then((data) => {
        console.log(data.message)
      })
      .catch((error) => {
        console.error("Failed to toggle light:", error)
      })
  }

  const toggleDoor = () => {
    const newDoorState = !doorOpen
    const action = newDoorState ? "open" : "close"
    fetch("/api/door/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: name, action }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to toggle door")
        return res.json()
      })
      .then((data) => {
        console.log(data.message)
      })
      .catch((error) => {
        console.error("Failed to toggle door:", error)
      })
  }

  const toggleClothesline = () => {
    const newState = !clotheslineExtended
    const action = newState ? "extend" : "retract"
    fetch("/api/clothesline/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: name, action }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to toggle clothesline")
        return res.json()
      })
      .then((data) => {
        console.log(data.message)
      })
      .catch((error) => {
        console.error("Failed to toggle clothesline:", error)
      })
  }

  const toggleClotheslineMode = () => {
    const newState = !clotheslineManualMode
    const mode = newState ? "manual" : "auto"
    setClotheslineMode(newState)
    fetch("/api/clothesline/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to toggle clothesline mode")
      })
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
        console.error("Failed to toggle clothesline mode:", error)
      })
  }

  const sidebarGradientStyle = {
    background: "linear-gradient(135deg, #5887DA 0%, #4C7380 50%, #6A9A6F 100%)",
    color: "#333333",
    boxShadow:
      "0 10px 30px -5px rgba(0, 0, 0, 0.25), 0 4px 15px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease-in-out",
  }

  const sidebarHoverStyle = {
    boxShadow:
      "0 15px 35px -5px rgba(0, 0, 0, 0.3), 0 8px 20px -5px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)",
    transform: "translateY(-3px)",
  }

  useEffect(() => {
    if (email === null && isInitialized) {
      router.replace("/login")
    }
  }, [email, isInitialized, router])

  if (!isInitialized) return null // Atau tampilkan loading spinner

  return (
    <div className="flex h-screen bg-background">
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isMobile && !isSidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-solid-border"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-[#4C7380]" />
        </button>
      )}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed z-50 flex flex-col lg:static lg:w-80 rounded-2xl shadow-xl drop-shadow-xl mx-3 mt-3 lg:mt-3 lg:ml-6 h-[calc(100vh-1.5rem)]",
          "left-0 top-0 w-[75%] lg:max-w-none max-w-[250px]",
          isSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-[-100%] opacity-0 lg:translate-x-0 lg:opacity-100",
          "transition-all duration-300 ease-in-out sidebar-transition",
          "hover:sidebar-hover",
        )}
        style={{
          display: !sidebarVisible && isMobile ? "none" : "flex",
          ...sidebarGradientStyle,
        }}
        onMouseEnter={(e) => {
          if (e.currentTarget) {
            Object.assign(e.currentTarget.style, sidebarHoverStyle)
          }
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget) {
            Object.assign(e.currentTarget.style, {
              boxShadow: sidebarGradientStyle.boxShadow,
              transform: "translateY(0)",
            })
          }
        }}
      >
        <div className="flex h-16 items-center px-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <Home className="h-5 w-5 text-white" />
            <span>Homytech</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden rounded-lg text-white hover:bg-white/10"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 overflow-auto py-3 lg:py-6">
          <div className="px-3 lg:px-4 py-2">
            <h3 className="mb-4 px-2 text-sm font-medium uppercase text-white/70">Dashboard</h3>
            <div className="space-y-2">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200",
                  activeTab === "overview"
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10",
                )}
                onClick={() => {
                  setActiveTab("overview")
                  if (isMobile) setIsSidebarOpen(false)
                }}
              >
                <Home className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                Overview
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200",
                  activeTab === "analytics"
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10",
                )}
                onClick={() => {
                  setActiveTab("analytics")
                  if (isMobile) setIsSidebarOpen(false)
                }}
              >
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                Analytics
              </Button>
            </div>
          </div>
          <div className="mt-6 lg:mt-8 px-3 lg:px-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 lg:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <Coffee className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                <h3 className="font-medium text-white text-sm lg:text-base">Home Tip</h3>
              </div>
              <p className="text-xs lg:text-sm text-white/80">
                Opening your windows for 10 minutes each day can improve air quality and reduce energy costs.
              </p>
            </div>
          </div>
        </nav>
        <div className="p-3 lg:p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10 border-2 border-white/20 bg-white/10 flex items-center justify-center rounded-full">
                <User className="text-white w-5 lg:w-6 lg:h-6" />
              </Avatar>
              <div>
                <p className="text-xs lg:text-sm font-medium text-white">{name}</p>
                <p className="text-xs text-white/70 hidden lg:block">{email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:h-10 lg:w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout()
                }
              }}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6">
          {activeTab === "overview" ? (
            <DashboardControls
              currentTime={currentTime}
              lights={lights}
              doorOpen={doorOpen}
              clotheslineExtended={clotheslineExtended}
              clotheslineManualMode={clotheslineManualMode}
              deviceUpdates={
                deviceUpdates ??
                {
                  lights: [],
                  door: { user: "", action: "", timestamp: new Date() },
                  clothesline: { user: "", action: "", timestamp: new Date() },
                }
              }
              onLightToggle={toggleLight}
              onDoorToggle={toggleDoor}
              onClotheslineToggle={toggleClothesline}
              onManualMode={toggleClotheslineMode}
            />
          ) : (
            <AnalyticsDashboard />
          )}
        </div>
      </main>
    </div>
  )
}
