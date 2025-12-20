import { format } from "date-fns"
import { Shirt } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ClotheslineLog {
  id: number
  user: string
  action: string
  timestamp: Date
  source: string
}

interface ClotheslineLogProps {
  logs: ClotheslineLog[]
  currentPage: number
  total: number // tambahkan baris ini
  onPageChange: (page: number) => void // pastikan ada juga
}

export function ClotheslineLog({ logs, currentPage, total, onPageChange }: ClotheslineLogProps) {
  const LOGS_PER_PAGE = 10
  const totalPages = Math.max(1, Math.ceil(total / LOGS_PER_PAGE))
  const currentLogs = logs // gunakan langsung logs dari props

  return (
    <Card className="mt-6 border-solid-border dark:border-solid-text-light/20 shadow-soft overflow-hidden card-hover">
      <CardHeader className="bg-solid-muted dark:bg-solid-text-secondary/20 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-solid-text dark:text-solid-background">
          <Shirt className="h-5 w-5 text-[#4C7380]" />
          Clothesline Activity Log
        </CardTitle>
        <CardDescription className="text-solid-text-secondary dark:text-solid-text-light">
          Recent clothesline activity
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-b-lg">
          <Table>
            <TableCaption className="pb-2">A list of recent clothesline activity.</TableCaption>
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
                    <TableCell className="font-medium text-black dark:text-gray-200">{log.user}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          log.action === "extended"
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
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
                          log.source === "Sensor"
                            ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-400"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
                        )}
                      >
                        {log.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-black dark:text-gray-200">{format(log.timestamp, "PPp")}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-solid-text-secondary dark:text-solid-text-light">
                      <Shirt className="h-8 w-8 mb-2 opacity-40" />
                      <p>No clothesline logs available</p>
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
