import { DashboardLogs } from "@/components/dashboard-logs"

export function AnalyticsDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-solid-text dark:text-solid-background px-3 py-1.5 bg-solid-muted/50 dark:bg-solid-text-secondary/10 rounded-lg inline-block">
        Device Activity Analysis
        </h2>
        <p className="text-solid-text-secondary dark:text-solid-text-light mb-6 ml-3">
          View detailed logs and usage patterns for all your smart home devices.
        </p>

        <DashboardLogs />
      </div>
    </div>
  )
}
