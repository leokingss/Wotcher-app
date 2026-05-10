/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { siteName?: string; token: string }

export const ReauthenticationEmail = ({ siteName, token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        {siteName && <Section style={brand}><Text style={brandText}>{siteName}</Text></Section>}
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeWrap}><Text style={codeStyle}>{token}</Text></Section>
        <Text style={footer}>This code expires shortly. Didn't request it? You can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Avenir Next", Avenir, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '520px' }
const brand = { borderBottom: '2px solid #1B1C1E', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#1B1C1E', margin: 0 }
const h1 = { fontSize: '26px', fontWeight: 800 as const, color: '#1B1C1E', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3b3d', lineHeight: '1.6', margin: '0 0 18px' }
const codeWrap = { backgroundColor: '#1B1C1E', borderRadius: '14px', padding: '22px', textAlign: 'center' as const, margin: '0 0 28px' }
const codeStyle = { fontFamily: '"SF Mono", Menlo, Consolas, monospace', fontSize: '32px', fontWeight: 800 as const, color: '#FFD700', letterSpacing: '0.4em', margin: 0 }
const footer = { fontSize: '12px', color: '#8a8b8d', lineHeight: '1.5', margin: '30px 0 0', borderTop: '1px solid #ececec', paddingTop: '18px' }
