/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}><Text style={brandText}>{siteName}</Text></Section>
        <Heading style={h1}>Welcome aboard</Heading>
        <Text style={text}>
          Thanks for signing up for <Link href={siteUrl} style={link}>{siteName}</Link>. Confirm <strong>{recipient}</strong> to activate your account.
        </Text>
        <Section style={btnWrap}><Button style={button} href={confirmationUrl}>Verify Email</Button></Section>
        <Text style={footer}>If you didn't create an account, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
