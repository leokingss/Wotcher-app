/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}><Text style={brandText}>{siteName}</Text></Section>
        <Heading style={h1}>Confirm email change</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={btnWrap}><Button style={button} href={confirmationUrl}>Confirm Change</Button></Section>
        <Text style={footer}>If you didn't request this change, secure your account immediately.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Avenir Next", Avenir, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '520px' }
const brand = { borderBottom: '2px solid #1B1C1E', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#1B1C1E', margin: 0 }
const h1 = { fontSize: '26px', fontWeight: 800 as const, color: '#1B1C1E', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3b3d', lineHeight: '1.6', margin: '0 0 26px' }
const link = { color: '#1B1C1E', textDecoration: 'underline', textDecorationColor: '#FFD700', textUnderlineOffset: '3px' }
const btnWrap = { margin: '0 0 32px' }
const button = { backgroundColor: '#FFD700', color: '#1B1C1E', fontSize: '14px', fontWeight: 700 as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.02em' }
const footer = { fontSize: '12px', color: '#8a8b8d', lineHeight: '1.5', margin: '30px 0 0', borderTop: '1px solid #ececec', paddingTop: '18px' }
