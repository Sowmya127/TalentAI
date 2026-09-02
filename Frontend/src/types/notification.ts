export type NotificationChannel = 'Email' | 'SMS' | 'InApp'

export interface NotificationHistoryItem {
  notificationId: number
  channel: NotificationChannel
  event: string
  sentAt: string
  recipientId?: number
  status?: string
}

export interface TriggerNotificationRequest {
  channel: NotificationChannel
  recipientId: number
  template: string
  event: string
}

export interface TriggerNotificationResponse {
  notificationId: number
  status: string
}

export interface NotificationHistoryParams {
  recipientId?: number
  page?: number
  size?: number
}
