// Real-time notification system component
"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, AlertCircle, Clock, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationService } from "@/lib/notification-service"

export function NotificationSystem({ userEmail, userRole }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!userEmail && !userRole) return

    const loadNotifications = () => {
      const userNotifications = NotificationService.getNotifications(userEmail, userRole)
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.filter((n) => !n.read).length)
    }

    loadNotifications()

    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [userEmail, userRole])

  const handleMarkAsRead = (notificationId) => {
    NotificationService.markAsRead(notificationId)
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "report_approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "report_assigned":
        return <UserCheck className="w-4 h-4 text-blue-600" />
      case "report_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "task_assigned":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "task_started":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "new_report":
        return <AlertCircle className="w-4 h-4 text-purple-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now"

    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-transparent">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                  !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
