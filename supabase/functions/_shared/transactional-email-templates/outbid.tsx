/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Picture Pal'

interface OutbidProps {
  itemTitle?: string
  newBid?: string
  listingUrl?: string
}

const OutbidEmail = ({ itemTitle, newBid, listingUrl }: OutbidProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been outbid on {itemTitle ?? 'an auction'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been outbid</Heading>
        <Text style={text}>
          Someone just placed a higher bid on
          <strong> {itemTitle ?? 'an item you were bidding on'}</strong>
          {newBid ? <> — the current bid is now <strong>${newBid}</strong>.</> : '.'}
        </Text>
        <Text style={text}>Don't lose it — place a new bid before the auction ends.</Text>
        {listingUrl && (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={listingUrl} style={button}>Place a new bid</Button>
          </Section>
        )}
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OutbidEmail,
  subject: (d: Record<string, any>) => `You've been outbid on ${d?.itemTitle ?? 'an auction'}`,
  displayName: 'Outbid notification',
  previewData: { itemTitle: 'Vintage Vinyl Record', newBid: '85.00', listingUrl: 'https://example.com/listing/123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#1B1C1E', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#FFD700', color: '#1B1C1E', fontSize: '15px', fontWeight: 'bold',
  padding: '14px 28px', borderRadius: '999px', textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '40px 0 0' }
