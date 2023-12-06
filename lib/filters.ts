import { Token } from "./tokens"

export const filterOffersByToken = (offers: any[], token: Token) =>
  offers?.filter((offer: any) => offer.token === token)
