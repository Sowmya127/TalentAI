import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  NotificationHistoryItem,
  NotificationHistoryParams,
  TriggerNotificationRequest,
  TriggerNotificationResponse,
} from '@/types/notification'
import type { ListEnvelope } from '@/types/common'

export const notificationApi = {
  trigger: (payload: TriggerNotificationRequest) =>
    axiosClient.post<TriggerNotificationResponse>(ENDPOINTS.notifications.trigger, payload).then((res) => res.data),

  history: (params: NotificationHistoryParams) =>
    axiosClient
      .get<ListEnvelope<NotificationHistoryItem>>(ENDPOINTS.notifications.history, { params })
      .then((res) => res.data),
}
