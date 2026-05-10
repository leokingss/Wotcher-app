/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as outbid } from './outbid.tsx'
import { template as auctionWon } from './auction-won.tsx'
import { template as itemSold } from './item-sold.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'outbid': outbid,
  'auction-won': auctionWon,
  'item-sold': itemSold,
}
