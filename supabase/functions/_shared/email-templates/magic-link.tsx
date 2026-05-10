/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}><Text style={brandText}>{siteName}</Text></Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>Click the button below to log in to {siteName}. This link expires shortly.</Text>
        <Section style={btnWrap}><Button style={button} href={confirmationUrl}>Log In</Button></Section>
        <Text style={footer}>Didn't request this link? You can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Avenir Next", Avenir, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '520px' }
const brand = { borderBottom: '2px solid #1B1C1E', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#1B1C1E', margin: 0 }
const h1 = { fontSize: '26px', fontWeight: 800 as const, color: '#1B1C1E', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3b3d', lineHeight: '1.6', margin: '0 0 26px' }
const btnWrap = { margin: '0 0 32px' }
const button = { backgroundColor: '#FFD700', color: '#1B1C1E', fontSize: '14px', fontWeight: 700 as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.02em' }
const footer = { fontSize: '12px', color: '#8a8b8d', lineHeight: '1.5', margin: '30px 0 0', borderTop: '1px solid #ececec', paddingTop: '18px' }
