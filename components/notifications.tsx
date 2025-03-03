"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useAppStore } from "@/lib/store"

export default function Notifications() {
  const { notifications, removeNotification } = useAppStore()

  useEffect(() => {
    if (notifications) {
      notifications.forEach((notification) => {
        setTimeout(() => removeNotification(notification.id), 5000)
      })
    }
  }, [notifications, removeNotification])

  if (!notifications || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`mb-2 p-4 rounded-md shadow-md flex justify-between items-center ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          } text-white`}
        >
          <span>{notification.message}</span>
          <button onClick={() => removeNotification(notification.id)} className="ml-4">
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}

