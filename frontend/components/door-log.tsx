import { format } from "date-fns"
import { DoorOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DoorLog {
  id: number
  user: string
  action: string
  timestamp: Date
  source: string
}

interface DoorLogProps {
  logs: DoorLog[]
  currentPage: number
  total: number
  onPageChange: (page: number) => void
}

const LOGS_PER_PAGE = 10

export function DoorLog({ logs, currentPage, total, onPageChange }: DoorLogProps) {
  const totalPages = Math.max(1, Math.ceil(total / LOGS_PER_PAGE))
  const currentLogs = logs // gunakan langsung logs dari props

  return (
    <Card className="mt-6 border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover">
      <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
          <DoorOpen className="h-5 w-5 text-[#4C7380]" />
          Door Activity Log
        </CardTitle>
        <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
          Recent door activity with source information
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-b-lg">
          <Table>
            <TableCaption className="pb-2">A list of recent door activity.</TableCaption>
            <TableHeader className="bg-solid-muted dark:bg-solid-text-secondary/20">
              <TableRow>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">User</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Action</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Source</TableHead>
                <TableHead className="font-medium text-solid-text dark:text-solid-background">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.length > 0 ? (
                currentLogs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "transition-colors hover:bg-solid-muted dark:hover:bg-solid-text-secondary/10",
                      index % 2 === 0
                        ? "bg-solid-surface dark:bg-solid-text"
                        : "bg-solid-muted/50 dark:bg-solid-text-secondary/5",
                    )}
                  >
                    <TableCell className="font-medium text-sage-700 dark:text-sage-300">{log.user}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          log.action === "opened"
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
                        )}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          log.source === "RFID"
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
                        )}
                      >
                        {log.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sage-500 dark:text-sage-500">{format(log.timestamp, "PPp")}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-solid-text-secondary dark:text-solid-text-light">
                      <DoorOpen className="h-8 w-8 mb-2 opacity-40" />
                      <p>No door logs available</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-solid-muted/50 dark:bg-solid-text-secondary/5">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      </CardContent>
    </Card>
  )
}
