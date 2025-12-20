"use client"
import React, { useEffect, useState } from "react"
import { Lightbulb, DoorOpen, Shirt, Coffee, Thermometer, Wind, Droplets, Sun, Cloud, CloudRain, CloudFog, Snowflake, Zap } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

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

interface DashboardControlsProps {
  currentTime: Date
  lights: boolean[]
  doorOpen: boolean
  clotheslineExtended: boolean
  clotheslineManualMode: boolean
  deviceUpdates: DeviceUpdates
  onLightToggle: (index: number) => void
  onDoorToggle: () => void
  onClotheslineToggle: () => void
  onManualMode: () => void
}

export function DashboardControls({
  currentTime,
  lights,
  doorOpen,
  clotheslineExtended,
  clotheslineManualMode,
  deviceUpdates,
  onLightToggle,
  onDoorToggle,
  onClotheslineToggle,
  onManualMode,
}: DashboardControlsProps) {


  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Get day name
  const getDayName = () => {
    return format(currentTime, "EEEE")
  }

  // Get date
  const getDate = () => {
    return format(currentTime, "MMM dd, yyyy")
  }

  // Tambahkan state untuk weather
  const [weatherData, setWeatherData] = useState<{
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    precipitation: number
    conditionLabel?: string
    conditionDesc?: string
  } | null>(null)

useEffect(() => {
  fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.7694&longitude=110.3686&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=1&forecast_hours=1&past_hours=1")
    .then(res => res.json())
    .then(json => {
      const len = json.hourly.time.length
      const idx = len - 1
      const code = json.hourly.weather_code[idx]
      const { label, desc } = wmoToConditionAndDesc(code)
      setWeatherData({
        temperature: json.hourly.temperature_2m[idx],
        condition: label.toLowerCase(),
        humidity: json.hourly.relative_humidity_2m[idx],
        windSpeed: json.hourly.wind_speed_10m[idx],
        precipitation: json.hourly.precipitation_probability[idx],
        conditionLabel: label,
        conditionDesc: desc,
      })
    })
}, [])


  const { name } = useAuth()

  return (
    <>
      {/* Welcome Message */}
      <section className="mb-8 -mt-6 lg:-mt-3 mt-2 sm:mt-0">
        <div
          className="text-white dark:text-white rounded-2xl p-8 shadow-soft relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #5887DA 0%, #4C7380 50%, #6A9A6F 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-bl-full"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3 text-white">
              {getGreeting()}, <span className="text-white/80">{name || "User"}!</span>
            </h1>
            <p className="text-white/90 text-lg">Welcome to your Homytech smart home dashboard</p>
          </div>
        </div>
      </section>

      {/* Weather Forecast - Full Width */}
      <section className="mb-8">
        <Card className="w-full overflow-hidden border-solid-border dark:border-solid-text-light/20 shadow-soft">
          <div
            className="relative overflow-hidden rounded-t-xl"
            style={{
              background: "linear-gradient(to bottom, #8B6EAE 0%, #E78AA8 100%)",
              height: "220px",
            }}
          >
            {/* Stylized clouds */}
            <div className="absolute top-5 left-10 w-24 h-12 bg-white/30 rounded-full"></div>
            <div className="absolute top-10 left-20 w-32 h-16 bg-white/20 rounded-full"></div>
            <div className="absolute top-8 right-20 w-28 h-14 bg-white/25 rounded-full"></div>
            <div className="absolute top-3 right-40 w-20 h-10 bg-white/15 rounded-full"></div>

            <div className="p-6 text-white h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Weather</h2>
                  <div className="flex items-center">
                    <div className="text-5xl font-bold">{weatherData?.temperature}°C</div>
                    <div className="ml-4">{getWeatherIcon(weatherData?.condition ?? "")}</div>
                  </div>
                  <div className="mt-3 flex items-center">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 text-sm">
                      {weatherData?.conditionLabel ?? "-"}
                    </Badge>
                    <span className="ml-2 text-white/80 text-sm">
                      {weatherData?.conditionDesc ?? ""}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium">{getDayName()}</div>
                  <div className="text-sm opacity-90">{getDate()}</div>
                  <div className="text-sm opacity-90">{format(currentTime, "h:mm a")}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-solid-text">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-solid-text-secondary/20 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-[#4C7380]" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Precipitation</div>
                </div>
                <div className="text-xl font-semibold text-[#4C7380]">{weatherData?.precipitation}%</div>
              </div>
              <div className="bg-white dark:bg-solid-text-secondary/20 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-[#4C7380]" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
                </div>
                <div className="text-xl font-semibold text-[#4C7380]">{weatherData?.humidity}%</div>
              </div>
              <div className="bg-white dark:bg-solid-text-secondary/20 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="h-4 w-4 text-[#4C7380]" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Wind</div>
                </div>
                <div className="text-xl font-semibold text-[#4C7380]">{weatherData?.windSpeed} km/h</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Device Controls */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-solid-text dark:text-solid-background flex items-center gap-2 px-2 py-1 bg-solid-muted/50 dark:bg-solid-text-secondary/10 rounded-lg inline-block">
          <Coffee className="h-6 w-6 text-[#4C7380]" />
          Home Controls
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Lights Control */}
          <Card className="border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover bg-solid-muted">
            <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 pb-4 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
                <Lightbulb className="h-5 w-5 text-[#4C7380]" />
                Lighting
              </CardTitle>
              <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
                Control your home lighting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-solid-muted dark:bg-solid-text-secondary/20">
              {lights.map((isOn, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isOn ? "bg-amber-100 dark:bg-amber-900" : "bg-gray-100 dark:bg-gray-800",
                      )}
                    >
                      <Lightbulb
                        className={cn("h-5 w-5 transition-colors", isOn ? "text-amber-500" : "text-gray-400")}
                      />
                    </div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {index === 0 ? "Living Room" : index === 1 ? "Bedroom" : "Terrace"} Light
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isOn ? "default" : "outline"}
                      className={cn(
                        "font-medium transition-all",
                        isOn
                          ? "bg-[#4C7380] hover:bg-[#3a5a64] text-white"
                          : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {isOn ? "ON" : "OFF"}
                    </Badge>
                    <Switch
                      checked={isOn}
                      onCheckedChange={() => onLightToggle(index)}
                      className="data-[state=checked]:bg-[#4C7380] data-[state=checked]:text-white switch-animation"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            {/* Lights Control Recent Activity */}
            <CardFooter className="pt-4 flex-col items-start bg-solid-muted dark:bg-solid-text-secondary/20 px-6">
              <p className="text-xs text-solid-text-secondary dark:text-solid-text-light mb-2">Recent activity:</p>
              <div className="text-xs space-y-2 w-full">
                {deviceUpdates.lights && deviceUpdates.lights.length > 0 ? (
                  deviceUpdates.lights.map((update, index) =>
                    update &&
                      update.user &&
                      update.action &&
                      update.timestamp instanceof Date &&
                      !isNaN(update.timestamp.getTime()) ? (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-amber-900/20"
                      >
                        <span className="text-solid-text-secondary dark:text-solid-text-light">
                          <strong>{update.user}</strong> {update.action}{" "}
                          {index === 0 ? "Living Room" : index === 1 ? "Kitchen" : "Bedroom"} light
                        </span>
                        <span className="text-solid-text-secondary dark:text-solid-text-light">
                          {format(update.timestamp, "h:mm a")}
                        </span>
                      </div>
                    ) : null
                  )
                ) : (
                  <span className="text-solid-text-secondary dark:text-solid-text-light">No data</span>
                )}
              </div>
            </CardFooter>
          </Card>

          {/* Door Control */}
          <Card className="border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover bg-solid-muted">
            <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 pb-4 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
                <DoorOpen className="h-5 w-5 text-[#4C7380]" />
                Front Door
              </CardTitle>
              <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
                Control your front door
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-solid-muted dark:bg-solid-text-secondary/20">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative">
                  <div
                    className={cn(
                      "w-32 h-48 border-2 rounded-t-lg relative transition-all duration-500 shadow-[5px_5px_15px_rgba(0,0,0,0.1)]",
                      doorOpen
                        ? "border-sage-300 dark:border-sage-600 bg-sage-100/80 dark:bg-sage-800/80"
                        : "bg-sage-100 dark:bg-sage-800 border-sage-300 dark:border-sage-600",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1/2 w-2 h-6 bg-gray-700 dark:bg-gray-400 rounded-r-sm -translate-y-1/2 opacity-100 transition-all duration-500",
                        doorOpen ? "right-8" : "-right-2",
                      )}
                    />
                    {/* Door decoration */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-sage-400 dark:border-sage-500"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full z-10">
                  <span className="font-medium text-solid-text-secondary dark:text-solid-text-light">Door Status</span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={doorOpen ? "default" : "outline"}
                      className={cn(
                        "font-medium transition-all",
                        doorOpen
                          ? "bg-[#4C7380] hover:bg-[#3a5a64] text-white"
                          : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {doorOpen ? "OPEN" : "CLOSED"}
                    </Badge>
                    <Switch
                      checked={doorOpen}
                      onCheckedChange={onDoorToggle}
                      className="data-[state=checked]:bg-[#4C7380] data-[state=checked]:text-white switch-animation relative z-20"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Door Control Recent Activity */}
            <CardFooter className="pt-4 flex-col items-start bg-solid-muted dark:bg-solid-text-secondary/20 px-6">
              <p className="text-xs text-solid-text-secondary dark:text-solid-text-light mb-2">Recent activity:</p>
              <div className="text-xs w-full">
                {deviceUpdates.door &&
                  deviceUpdates.door.user &&
                  deviceUpdates.door.action &&
                  deviceUpdates.door.timestamp instanceof Date &&
                  !isNaN(deviceUpdates.door.timestamp.getTime()) ? (
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-sage-900/20">
                    <span className="text-solid-text-secondary dark:text-solid-text-light">
                      <strong>{deviceUpdates.door.user}</strong> {deviceUpdates.door.action} the front door
                    </span>
                    <span className="text-solid-text-secondary dark:text-solid-text-light">
                      {format(deviceUpdates.door.timestamp, "h:mm a")}
                    </span>
                  </div>
                ) : (
                  <span className="text-solid-text-secondary dark:text-solid-text-light">No data</span>
                )}
              </div>
            </CardFooter>
          </Card>

          {/* Clothesline Control */}
          <Card className="border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover bg-solid-muted">
            <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 pb-4 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
                <Shirt className="h-5 w-5 text-[#4C7380]" />
                Clothesline
              </CardTitle>
              <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
                Control your clothesline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-solid-muted dark:bg-solid-text-secondary/20">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative w-full h-28 border-t border-dashed border-blue-300 dark:border-blue-600 flex items-start justify-center">
                  <div
                    className={cn(
                      "absolute top-0 flex items-center gap-3 transition-all duration-700",
                      clotheslineExtended ? "translate-x-1/3" : "-translate-x-1/3",
                    )}
                  >
                    <Shirt
                      className={cn(
                        "h-10 w-10 transition-all",
                        clotheslineExtended ? "text-sky-500 rotate-0" : "text-gray-400 rotate-45",
                      )}
                    />
                    <Shirt
                      className={cn(
                        "h-10 w-10 transition-all",
                        clotheslineExtended ? "text-rose-500 rotate-0" : "text-gray-400 rotate-45",
                      )}
                    />
                    <Shirt
                      className={cn(
                        "h-10 w-10 transition-all",
                        clotheslineExtended ? "text-emerald-500 rotate-0" : "text-gray-400 rotate-45",
                      )}
                    />
                  </div>
                  {/* Clothesline posts */}
                  <div className="absolute left-0 top-0 w-2 h-16 bg-blue-200 dark:bg-blue-700 rounded-b-lg"></div>
                  <div className="absolute right-0 top-0 w-2 h-16 bg-blue-200 dark:bg-blue-700 rounded-b-lg"></div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-solid-text-secondary dark:text-solid-text-light">
                    Clothesline Status
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={clotheslineExtended ? "default" : "outline"}
                      className={cn(
                        "font-medium transition-all",
                        clotheslineExtended
                          ? "bg-[#4C7380] hover:bg-[#3a5a64] text-white"
                          : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {clotheslineExtended ? "EXTENDED" : "RETRACTED"}
                    </Badge>
                    <Switch
                      checked={clotheslineExtended}
                      onCheckedChange={onClotheslineToggle}
                      className="data-[state=checked]:bg-[#4C7380] data-[state=checked]:text-white switch-animation"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-solid-text-secondary dark:text-solid-text-light">Mode</span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={clotheslineManualMode ? "default" : "outline"}
                      className={cn(
                        "font-medium transition-all",
                        clotheslineManualMode
                          ? "bg-[#4C7380] hover:bg-[#3a5a64] text-white"
                          : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {clotheslineManualMode ? "MANUAL" : "AUTO"}
                    </Badge>
                    <Switch
                      checked={clotheslineManualMode}
                      onCheckedChange={onManualMode}
                      className="data-[state=checked]:bg-[#4C7380] data-[state=checked]:text-white switch-animation"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Clothesline Control Recent Activity */}
            <CardFooter className="pt-4 flex-col items-start bg-solid-muted dark:bg-solid-text-secondary/20 px-6">
              <p className="text-xs text-solid-text-secondary dark:text-solid-text-light mb-2">Recent activity:</p>
              <div className="text-xs w-full">
                {deviceUpdates.clothesline &&
                  deviceUpdates.clothesline.user &&
                  deviceUpdates.clothesline.action &&
                  deviceUpdates.clothesline.timestamp instanceof Date &&
                  !isNaN(deviceUpdates.clothesline.timestamp.getTime()) ? (
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-blue-900/20">
                    <span className="text-solid-text-secondary dark:text-solid-text-light">
                      <strong>{deviceUpdates.clothesline.user}</strong> {deviceUpdates.clothesline.action} the clothesline
                    </span>
                    <span className="text-solid-text-secondary dark:text-solid-text-light">
                      {format(deviceUpdates.clothesline.timestamp, "h:mm a")}
                    </span>
                  </div>
                ) : (
                  <span className="text-solid-text-secondary dark:text-solid-text-light">No data</span>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Home Tips Section */}
      <section className="mb-8">
        <Card className="border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden">
          <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 pb-4 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
              <Coffee className="h-5 w-5 text-[#4C7380]" />
              Home Comfort Tips
            </CardTitle>
            <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
              Suggestions to make your home more comfortable
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-solid-muted">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-solid-muted dark:bg-solid-text-secondary/20 p-4 rounded-xl">
                <h3 className="font-medium text-solid-text dark:text-solid-background mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#4C7380]" />
                  Lighting Tip
                </h3>
                <p className="text-sm text-solid-text-secondary dark:text-solid-text-light">
                  Consider dimming your lights in the evening to help prepare your body for sleep.
                </p>
              </div>
              <div className="bg-solid-muted dark:bg-solid-text-secondary/20 p-4 rounded-xl">
                <h3 className="font-medium text-solid-text dark:text-solid-background mb-2 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-[#4C7380]" />
                  Temperature Tip
                </h3>
                <p className="text-sm text-solid-text-secondary dark:text-solid-text-light">
                  The ideal temperature for sleep is between 18-20°C (65-68°F).
                </p>
              </div>
              <div className="bg-solid-muted dark:bg-solid-text-secondary/20 p-4 rounded-xl">
                <h3 className="font-medium text-solid-text dark:text-solid-background mb-2 flex items-center gap-2">
                  <Wind className="h-4 w-4 text-[#4C7380]" />
                  Air Quality Tip
                </h3>
                <p className="text-sm text-solid-text-secondary dark:text-solid-text-light">
                  Open windows for 10 minutes daily to refresh your home&apos;s air.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

// Helper function to get weather icon
function getWeatherIcon(condition: string) {
  switch (condition) {
    case "sunny":
      return <Sun className="h-12 w-12 text-white weather-sun" />
    case "cloudy":
      return <Cloud className="h-12 w-12 text-white weather-cloud" />
    case "rainy":
      return <CloudRain className="h-12 w-12 text-white weather-rain" />
    case "foggy":
      return <CloudFog className="h-12 w-12 text-white weather-fog" />
    case "snowy":
      return <Snowflake className="h-12 w-12 text-white weather-snow" />
    case "thunder":
      return <Zap className="h-12 w-12 text-white weather-thunder" />
    default:
      return <Sun className="h-12 w-12 text-white weather-sun" />
  }
}

function wmoToConditionAndDesc(code: number): { label: string; desc: string } {
  // Referensi: https://open-meteo.com/en/docs#api_form
  switch (code) {
    case 0:
      return { label: "Sunny", desc: "Clear sky" }
    case 1:
      return { label: "Cloudy", desc: "Mainly clear" }
    case 2:
      return { label: "Cloudy", desc: "Partly cloudy" }
    case 3:
      return { label: "Cloudy", desc: "Overcast" }
    case 45:
      return { label: "Foggy", desc: "Fog" }
    case 48:
      return { label: "Foggy", desc: "Depositing rime fog" }
    case 51:
      return { label: "Rainy", desc: "Drizzle: Light intensity" }
    case 53:
      return { label: "Rainy", desc: "Drizzle: Moderate intensity" }
    case 55:
      return { label: "Rainy", desc: "Drizzle: Dense intensity" }
    case 56:
      return { label: "Rainy", desc: "Freezing drizzle: Light intensity" }
    case 57:
      return { label: "Rainy", desc: "Freezing drizzle: Dense intensity" }
    case 61:
      return { label: "Rainy", desc: "Rain: Slight intensity" }
    case 63:
      return { label: "Rainy", desc: "Rain: Moderate intensity" }
    case 65:
      return { label: "Rainy", desc: "Rain: Heavy intensity" }
    case 66:
      return { label: "Rainy", desc: "Freezing rain: Light intensity" }
    case 67:
      return { label: "Rainy", desc: "Freezing rain: Heavy intensity" }
    case 71:
      return { label: "Snowy", desc: "Snow fall: Slight intensity" }
    case 73:
      return { label: "Snowy", desc: "Snow fall: Moderate intensity" }
    case 75:
      return { label: "Snowy", desc: "Snow fall: Heavy intensity" }
    case 77:
      return { label: "Snowy", desc: "Snow grains" }
    case 80:
      return { label: "Rainy", desc: "Rain showers: Slight" }
    case 81:
      return { label: "Rainy", desc: "Rain showers: Moderate" }
    case 82:
      return { label: "Rainy", desc: "Rain showers: Violent" }
    case 85:
      return { label: "Snowy", desc: "Snow showers: Slight" }
    case 86:
      return { label: "Snowy", desc: "Snow showers: Heavy" }
    case 95:
      return { label: "Thunder", desc: "Thunderstorm: Slight or moderate" }
    case 96:
      return { label: "Thunder", desc: "Thunderstorm: With slight hail" }
    case 99:
      return { label: "Thunder", desc: "Thunderstorm: With heavy hail" }
    default:
      return { label: "Unknown", desc: "Unknown weather" }
  }
}
