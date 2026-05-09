Building the engagement loop in 4 batches. Each batch is self-contained so you can stop after any of them.

## Batch 1 — Notifications UI upgrade

- Unread badge on the bottom-nav bell (red dot + count).
- Rebuild `Activity` page: group by day, support all new types (`outbid`, `auction_won`, `item_sold`, `new_listing`, `auction_ending_soon`).
- Each row deep-links: post → opens post, listing → opens seller's shopping tab, follow → opens profile.
- Realtime: badge and list update live via the existing `notifications` channel.
- Add a "Mark all read" action.

## Batch 2 — Direct messages (text + voice + media)

New tables (migration):
- `conversations` (id, created_at, last_message_at)
- `conversation_participants` (conversation_id, user_id) — composite PK, RLS so a user only sees their own conversations.
- `messages` (id, conversation_id, sender_id, body text, media_url, media_type enum `text|voice|image|video`, duration_seconds, created_at, read_at)
- RPC `get_or_create_dm(other_user uuid)` returns conversation id (security definer).
- Trigger: on new message, insert a `notifications` row (`type='message'`) for the other participant unless they're actively in the chat.

New storage bucket `dm-media` (private, RLS: only conversation participants can read).

UI:
- New `/messages` route → inbox list (last message preview, unread dot, avatar, timestamp).
- New `/messages/:conversationId` route → chat view.
  - Reuses `StrandWave` for voice notes, reuses voice recorder pattern from `CommentComposer`.
  - Image/video upload via paperclip, previewed inline.
  - Realtime via Supabase channel filtered on `conversation_id`.
- "Message" button on profile pages opens or creates the DM.
- Inbox entry point: paper-plane icon in the `Header` next to the dropdown, with unread badge.

## Batch 3 — Email notifications

Will trigger the email domain setup dialog if no domain exists yet (prerequisite).

After domain is configured, scaffold transactional emails for:
- `auction_won` — "You won {item}! Confirm shipping address."
- `item_sold` — "Your {item} sold. Buyer shipping details inside."
- `outbid` — "You've been outbid on {item}. Current bid: {amount}."
- `auction_ending_soon` — "1 hour left on {item}."

Wire the existing `settle-auctions` edge function and the `notify_outbid` trigger to also call `send-transactional-email`. Add a per-user email-preferences toggle (honour `suppressed_emails`).

## Batch 4 — Shop tab polish (Search page)

- Add a new "Shop" top-level chip on `/search` (currently it's a tab inside) so it's a first-class destination.
- Sections: **Ending soon** (auctions sorted by `ends_at` ascending), **Just listed** (newest), **From people you follow**, **Featured sellers** (top-rated via `seller_rating_summary`).
- Modern card grid with hover preview of bid/time-left.

## Technical details

- All DM realtime uses `supabase.channel('dm:'+conversationId).on('postgres_changes', ...)`.
- Voice recorder: MediaRecorder API → upload to `dm-media/{conversationId}/{uuid}.webm`, store signed URL.
- Notification badge: subscribe once at `BottomNav` and `Header` level via a new `useUnreadNotifications` hook (single shared query).
- Email: uses Lovable Emails queue (`enqueue_email` RPC), templates in `_shared/email-templates/`.

## Build order

I'll start with **Batch 1 (Notifications UI)** since it's the smallest and unblocks visual feedback for everything else, then move to Batch 2 (DMs) which is the largest. After Batch 2 I'll check in before doing Batch 3 (which needs your email domain) and Batch 4.

Approve to proceed.