import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { ApproveOfferRequest, GenerateOfferRequest, Offer, OfferStatusResponse } from '@/types/offer'

export const offerApi = {
  generate: (payload: GenerateOfferRequest) =>
    axiosClient.post<OfferStatusResponse>(ENDPOINTS.offers.create, payload).then((res) => res.data),

  getOffer: (offerId: number) => axiosClient.get<Offer>(ENDPOINTS.offers.byId(offerId)).then((res) => res.data),

  approve: (offerId: number, payload: ApproveOfferRequest) =>
    axiosClient.patch<OfferStatusResponse>(ENDPOINTS.offers.approve(offerId), payload).then((res) => res.data),

  send: (offerId: number) =>
    axiosClient.patch<OfferStatusResponse>(ENDPOINTS.offers.send(offerId)).then((res) => res.data),

  accept: (offerId: number) =>
    axiosClient.patch<OfferStatusResponse>(ENDPOINTS.offers.accept(offerId)).then((res) => res.data),

  decline: (offerId: number, payload: { declineReason: string }) =>
    axiosClient.patch<OfferStatusResponse>(ENDPOINTS.offers.decline(offerId), payload).then((res) => res.data),
}
