/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Picture Pal'

interface ItemSoldProps {
  itemTitle?: string
  salePrice?: string
  buyerName?: string
  listingUrl?: string
}

const ItemSoldEmail = ({ itemTitle, salePrice, buyerName, listingUrl }: ItemSoldProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your item {itemTitle ?? ''} sold!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your item sold 🎉</Heading>
        <Text style={text}>
          <strong>{itemTitle ?? 'Your listing'}</strong> just sold
          {salePrice ? <> for <strong>${salePrice}</strong></> : ''}
          {buyerName ? <> to <strong>{buyerName}</strong></> : ''}.
        </Text>
        <Text style={text}>
          Check the buyer's shipping details and ship the item soon to keep your seller rating high.
        </Text>
        {listingUrl && (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={listingUrl} style={button}>View sale details</Button>
          </Section>
        )}
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ItemSoldEmail,
  subject: (d: Record<string, any>) => `🎉 ${d?.itemTitle ?? 'Your item'} sold!`,
  displayName: 'Item sold',
  previewData: { itemTitle: 'Vintage Vinyl Record', salePrice: '120.00', buyerName: 'Jane', listingUrl: 'https://example.com/listing/123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '26px', fontWeight: 'bold', color: '#1B1C1E', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#FFD700', color: '#1B1C1E', fontSize: '15px', fontWeight: 'bold',
  padding: '14px 28px', borderRadius: '999px', textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '40px 0 0' }
