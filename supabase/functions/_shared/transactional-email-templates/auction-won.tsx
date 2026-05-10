/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Picture Pal'

interface AuctionWonProps {
  itemTitle?: string
  finalBid?: string
  listingUrl?: string
}

const AuctionWonEmail = ({ itemTitle, finalBid, listingUrl }: AuctionWonProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Congrats! You won {itemTitle ?? 'the auction'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🏆 You won!</Heading>
        <Text style={text}>
          Congratulations — you won the auction for
          <strong> {itemTitle ?? 'this item'}</strong>
          {finalBid ? <> with a final bid of <strong>${finalBid}</strong>.</> : '.'}
        </Text>
        <Text style={text}>
          Confirm your shipping address so the seller can get your item on its way.
        </Text>
        {listingUrl && (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={listingUrl} style={button}>View order</Button>
          </Section>
        )}
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AuctionWonEmail,
  subject: (d: Record<string, any>) => `🏆 You won ${d?.itemTitle ?? 'the auction'}!`,
  displayName: 'Auction won',
  previewData: { itemTitle: 'Vintage Vinyl Record', finalBid: '120.00', listingUrl: 'https://example.com/listing/123' },
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
