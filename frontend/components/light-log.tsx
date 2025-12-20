import { format } from "date-fns"
import { Lightbulb } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationControls } from "@/components/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LightLog {
  id: number
  user: string
  action: string
  light: string
  timestamp: Date
}

interface LightLogProps {
  logs: LightLog[]
  currentPage: number
  total: number
  onPageChange: (page: number) => void
}

export function LightLog({
  logs,
  currentPage,
  total,
  onPageChange,
}: LightLogProps) {
  const LOGS_PER_PAGE = 10
  const totalPages = Math.max(1, Math.ceil(total / LOGS_PER_PAGE))

  const lightNameMap: Record<string, string> = {
    "Light 1": "Living Room",
    "Light 2": "Bedroom",
    "Light 3": "Kitchen",
  }

  return (
    <Card className="mt-6 border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover">
      <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
          <Lightbulb className="h-5 w-5 text-[#4C7380]" />
          Light Activity Log
        </CardTitle>
        <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
          Recent light activity
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-b-lg">
          <Table>
            <TableCaption className="pb-2">A list of recent light activity.</TableCaption>
            <TableHeader className="bg-solid-muted dark:bg-solid-text-secondary/20">
              <TableRow>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">User</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Light</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Action</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "transition-colors hover:bg-solid-muted dark:hover:bg-solid-text-secondary/10",
                      index % 2 === 0
                        ? "bg-solid-surface dark:bg-solid-text"
                        : "bg-solid-muted/50 dark:bg-solid-text-secondary/5",
                    )}
                  >
                    <TableCell className="font-medium text-black dark:text-gray-200">
                      {log.user}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 font-normal"
                      >
                        {lightNameMap[log.light] || log.light}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          log.action === "turned on"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
                            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
                        )}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-black dark:text-gray-200">
                      {format(log.timestamp, "PPp")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-solid-text-secondary dark:text-solid-text-light">
                      <Lightbulb className="h-8 w-8 mb-2 opacity-40" />
                      <p>No light logs available</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-solid-muted/50 dark:bg-solid-text-secondary/5">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
