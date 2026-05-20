export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_flags: {
        Row: {
          cleared_at: string | null
          cleared_by: string | null
          created_at: string
          created_by: string | null
          flag: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string
          created_by?: string | null
          flag: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string
          created_by?: string | null
          flag?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          notes: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      artist_profiles: {
        Row: {
          artist_name: string
          bio: string | null
          created_at: string
          external_link: string | null
          genres: string[]
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          artist_name: string
          bio?: string | null
          created_at?: string
          external_link?: string | null
          genres?: string[]
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          artist_name?: string
          bio?: string | null
          created_at?: string
          external_link?: string | null
          genres?: string[]
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bidder_registrations: {
        Row: {
          address_line1: string
          address_line2: string | null
          agreed_terms_at: string
          approved_cap: number | null
          bank_reference: string | null
          city: string
          country: string
          created_at: string
          date_of_birth: string
          declared_cap: number
          expires_at: string | null
          id: string
          id_document_back_path: string | null
          id_document_path: string
          legal_name: string
          phone: string
          postal_code: string
          proof_of_address_path: string
          proof_of_funds_path: string
          region: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["bidder_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          agreed_terms_at?: string
          approved_cap?: number | null
          bank_reference?: string | null
          city: string
          country: string
          created_at?: string
          date_of_birth: string
          declared_cap: number
          expires_at?: string | null
          id?: string
          id_document_back_path?: string | null
          id_document_path: string
          legal_name: string
          phone: string
          postal_code: string
          proof_of_address_path: string
          proof_of_funds_path: string
          region?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["bidder_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          agreed_terms_at?: string
          approved_cap?: number | null
          bank_reference?: string | null
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          declared_cap?: number
          expires_at?: string | null
          id?: string
          id_document_back_path?: string | null
          id_document_path?: string
          legal_name?: string
          phone?: string
          postal_code?: string
          proof_of_address_path?: string
          proof_of_funds_path?: string
          region?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["bidder_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string
          edited: boolean
          id: string
          post_id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edited?: boolean
          id?: string
          post_id: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edited?: boolean
          id?: string
          post_id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          buyer_id: string
          created_at: string
          details: string | null
          id: string
          order_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          source: string
          status: string
          stripe_dispute_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          details?: string | null
          id?: string
          order_id: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          source?: string
          status?: string
          stripe_dispute_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          source?: string
          status?: string
          stripe_dispute_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          buyer_shipping: Json | null
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          description: string | null
          ends_at: string | null
          fulfillment: string
          id: string
          post_id: string | null
          price: number | null
          return_policy: string
          seller_id: string
          shipping_required: boolean
          sold_at: string | null
          starting_bid: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
        }
        Insert: {
          buyer_shipping?: Json | null
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          description?: string | null
          ends_at?: string | null
          fulfillment?: string
          id?: string
          post_id?: string | null
          price?: number | null
          return_policy?: string
          seller_id: string
          shipping_required?: boolean
          sold_at?: string | null
          starting_bid?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
        }
        Update: {
          buyer_shipping?: Json | null
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          description?: string | null
          ends_at?: string | null
          fulfillment?: string
          id?: string
          post_id?: string | null
          price?: number | null
          return_policy?: string
          seller_id?: string
          shipping_required?: boolean
          sold_at?: string | null
          starting_bid?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          carrier?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          disputed_at?: string | null
          environment?: string
          id?: string
          kind: string
          listing_id: string
          paid_at?: string | null
          payout_mode?: string
          payout_status?: string
          platform_fee_cents: number
          refund_amount_cents?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          release_after?: string | null
          released_at?: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at?: string | null
          shipping?: Json | null
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          carrier?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          disputed_at?: string | null
          environment?: string
          id?: string
          kind?: string
          listing_id?: string
          paid_at?: string | null
          payout_mode?: string
          payout_status?: string
          platform_fee_cents?: number
          refund_amount_cents?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          release_after?: string | null
          released_at?: string | null
          seller_id?: string
          seller_net_cents?: number
          shipped_at?: string | null
          shipping?: Json | null
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          media_type: string
          media_url: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string
          media_url?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          toast_auctions: boolean
          toast_comments: boolean
          toast_dms: boolean
          toast_follows: boolean
          toast_likes: boolean
          toast_volume: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          toast_auctions?: boolean
          toast_comments?: boolean
          toast_dms?: boolean
          toast_follows?: boolean
          toast_likes?: boolean
          toast_volume?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          toast_auctions?: boolean
          toast_comments?: boolean
          toast_dms?: boolean
          toast_follows?: boolean
          toast_likes?: boolean
          toast_volume?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          listing_id: string | null
          metadata: Json | null
          post_id: string | null
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          post_id?: string | null
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          post_id?: string | null
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          entry_type: string
          environment: string
          id: string
          metadata: Json | null
          notes: string | null
          order_id: string
          status: string | null
          stripe_object_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type: string
          environment?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id: string
          status?: string | null
          stripe_object_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type?: string
          environment?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string
          status?: string | null
          stripe_object_id?: string | null
        }
        Relationships: []
      }
      payout_settings: {
        Row: {
          high_risk_hold_days: number
          hold_days: number
          id: number
          new_seller_hold_days: number
          new_seller_threshold: number
          updated_at: string
        }
        Insert: {
          high_risk_hold_days?: number
          hold_days?: number
          id?: number
          new_seller_hold_days?: number
          new_seller_threshold?: number
          updated_at?: string
        }
        Update: {
          high_risk_hold_days?: number
          hold_days?: number
          id?: number
          new_seller_hold_days?: number
          new_seller_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          post_id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          location: string | null
          media_type: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          location?: string | null
          media_type?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          location?: string | null
          media_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          subscription_period_end: string | null
          subscription_status: string | null
          subscription_tier: string
          updated_at: string
          username: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          updated_at?: string
          username: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          added_at: string
          item_id: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          list_id: string
        }
        Insert: {
          added_at?: string
          item_id: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          list_id: string
        }
        Update: {
          added_at?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["saved_item_type"]
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "saved_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_list_members: {
        Row: {
          created_at: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "saved_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_lists: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["list_visibility"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["list_visibility"]
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["list_visibility"]
        }
        Relationships: []
      }
      seller_identity_verifications: {
        Row: {
          created_at: string
          document_type: string | null
          environment: string
          id: string
          last_error: string | null
          status: string
          stripe_verification_session_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          environment?: string
          id?: string
          last_error?: string | null
          status?: string
          stripe_verification_session_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          environment?: string
          id?: string
          last_error?: string | null
          status?: string
          stripe_verification_session_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          seller_id: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          seller_id: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          seller_id?: string
        }
        Relationships: []
      }
      seller_stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          environment: string
          id: string
          payouts_enabled: boolean
          requirements_due: Json | null
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          environment?: string
          id?: string
          payouts_enabled?: boolean
          requirements_due?: Json | null
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          environment?: string
          id?: string
          payouts_enabled?: boolean
          requirements_due?: Json | null
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_suspensions: {
        Row: {
          id: string
          lifted_at: string | null
          lifted_by: string | null
          notes: string | null
          reason: string
          suspended_at: string
          suspended_by: string
          user_id: string
        }
        Insert: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          notes?: string | null
          reason: string
          suspended_at?: string
          suspended_by: string
          user_id: string
        }
        Update: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          notes?: string | null
          reason?: string
          suspended_at?: string
          suspended_by?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_trust_scores: {
        Row: {
          account_age_days: number
          computed_at: string
          delivered_count: number
          dispute_count: number
          identity_verified: boolean
          refund_count: number
          risk_level: string
          successful_sales: number
          total_sales: number
          trust_score: number
          user_id: string
          verified_badge: boolean
        }
        Insert: {
          account_age_days?: number
          computed_at?: string
          delivered_count?: number
          dispute_count?: number
          identity_verified?: boolean
          refund_count?: number
          risk_level?: string
          successful_sales?: number
          total_sales?: number
          trust_score?: number
          user_id: string
          verified_badge?: boolean
        }
        Update: {
          account_age_days?: number
          computed_at?: string
          delivered_count?: number
          dispute_count?: number
          identity_verified?: boolean
          refund_count?: number
          risk_level?: string
          successful_sales?: number
          total_sales?: number
          trust_score?: number
          user_id?: string
          verified_badge?: boolean
        }
        Relationships: []
      }
      seller_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          details: string | null
          id: string
          issued_by: string
          reason: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issued_by: string
          reason: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issued_by?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id?: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      track_saves: {
        Row: {
          created_at: string
          top10_rank: number | null
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          top10_rank?: number | null
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          top10_rank?: number | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_saves_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist_id: string
          audio_url: string
          cover_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          release_type: Database["public"]["Enums"]["release_type"]
          title: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          audio_url: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          release_type?: Database["public"]["Enums"]["release_type"]
          title: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          release_type?: Database["public"]["Enums"]["release_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_saves: {
        Row: {
          created_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_saves_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          artist_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      seller_rating_summary: {
        Row: {
          avg_rating: number | null
          review_count: number | null
          seller_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_extend_hold: {
        Args: { _extra_days: number; _notes: string; _order_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_mark_disputed: {
        Args: { _notes: string; _order_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      buy_listing: {
        Args: { _listing_id: string; _shipping: Json }
        Returns: {
          price: number
          seller_id: string
          title: string
        }[]
      }
      can_bid: { Args: { _amount: number; _user_id: string }; Returns: boolean }
      can_view_list: {
        Args: { _list: string; _viewer: string }
        Returns: boolean
      }
      clear_account_flag: {
        Args: { _flag_id: string; _notes: string }
        Returns: {
          cleared_at: string | null
          cleared_by: string | null
          created_at: string
          created_by: string | null
          flag: string
          id: string
          reason: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_flags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      flag_account: {
        Args: { _flag: string; _reason: string; _user_id: string }
        Returns: {
          cleared_at: string | null
          cleared_by: string | null
          created_at: string
          created_by: string | null
          flag: string
          id: string
          reason: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_flags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_buyer_shipping: { Args: { _listing_id: string }; Returns: Json }
      get_or_create_dm: { Args: { _other: string }; Returns: string }
      has_active_subscription: {
        Args: { _tier?: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_artist: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      is_list_owner: {
        Args: { _list: string; _viewer: string }
        Returns: boolean
      }
      is_seller_suspended: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      lift_seller_suspension: {
        Args: { _notes: string; _suspension_id: string }
        Returns: {
          id: string
          lifted_at: string | null
          lifted_by: string | null
          notes: string | null
          reason: string
          suspended_at: string
          suspended_by: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_suspensions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_order_delivered: {
        Args: { _order_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_order_refunded: {
        Args: { _amount_cents: number; _order_id: string; _reason: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_order_released: {
        Args: { _amount_cents: number; _order_id: string; _transfer_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_order_shipped: {
        Args: { _carrier: string; _order_id: string; _tracking_number: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          carrier: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          disputed_at: string | null
          environment: string
          id: string
          kind: string
          listing_id: string
          paid_at: string | null
          payout_mode: string
          payout_status: string
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          refunded_at: string | null
          release_after: string | null
          released_at: string | null
          seller_id: string
          seller_net_cents: number
          shipped_at: string | null
          shipping: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      open_dispute: {
        Args: { _details: string; _order_id: string; _reason: string }
        Returns: {
          buyer_id: string
          created_at: string
          details: string | null
          id: string
          order_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          source: string
          status: string
          stripe_dispute_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_trust_score: {
        Args: { _user_id: string }
        Returns: {
          account_age_days: number
          computed_at: string
          delivered_count: number
          dispute_count: number
          identity_verified: boolean
          refund_count: number
          risk_level: string
          successful_sales: number
          total_sales: number
          trust_score: number
          user_id: string
          verified_badge: boolean
        }
        SetofOptions: {
          from: "*"
          to: "seller_trust_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_listing: {
        Args: { _listing_id: string; _reason: string }
        Returns: {
          buyer_shipping: Json | null
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          description: string | null
          ends_at: string | null
          fulfillment: string
          id: string
          post_id: string | null
          price: number | null
          return_policy: string
          seller_id: string
          shipping_required: boolean
          sold_at: string | null
          starting_bid: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_report: {
        Args: {
          _notes: string
          _report_id: string
          _resolution: string
          _status: string
        }
        Returns: {
          assigned_to: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          target_id: string
          target_type: string
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_bidder_registration: {
        Args: {
          _address_line1: string
          _address_line2: string
          _bank_reference: string
          _city: string
          _country: string
          _date_of_birth: string
          _declared_cap: number
          _id_document_back_path: string
          _id_document_path: string
          _legal_name: string
          _phone: string
          _postal_code: string
          _proof_of_address_path: string
          _proof_of_funds_path: string
          _region: string
        }
        Returns: {
          address_line1: string
          address_line2: string | null
          agreed_terms_at: string
          approved_cap: number | null
          bank_reference: string | null
          city: string
          country: string
          created_at: string
          date_of_birth: string
          declared_cap: number
          expires_at: string | null
          id: string
          id_document_back_path: string | null
          id_document_path: string
          legal_name: string
          phone: string
          postal_code: string
          proof_of_address_path: string
          proof_of_funds_path: string
          region: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["bidder_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bidder_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      suspend_seller: {
        Args: { _notes: string; _reason: string; _user_id: string }
        Returns: {
          id: string
          lifted_at: string | null
          lifted_by: string | null
          notes: string | null
          reason: string
          suspended_at: string
          suspended_by: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_suspensions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      warn_seller: {
        Args: { _details: string; _reason: string; _user_id: string }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          details: string | null
          id: string
          issued_by: string
          reason: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_warnings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_type: "listener" | "artist"
      app_role: "admin" | "moderator" | "user"
      bidder_status: "pending" | "approved" | "rejected" | "revoked"
      list_visibility: "public" | "private" | "shared"
      listing_status: "active" | "sold" | "ended" | "cancelled"
      listing_type: "fixed" | "auction"
      notification_type:
        | "like"
        | "dislike"
        | "comment"
        | "follow"
        | "outbid"
        | "auction_won"
        | "item_sold"
        | "auction_ending"
        | "new_listing"
        | "message"
      reaction_type: "like" | "dislike"
      release_type: "single" | "ep" | "album"
      saved_item_type: "post" | "listing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["listener", "artist"],
      app_role: ["admin", "moderator", "user"],
      bidder_status: ["pending", "approved", "rejected", "revoked"],
      list_visibility: ["public", "private", "shared"],
      listing_status: ["active", "sold", "ended", "cancelled"],
      listing_type: ["fixed", "auction"],
      notification_type: [
        "like",
        "dislike",
        "comment",
        "follow",
        "outbid",
        "auction_won",
        "item_sold",
        "auction_ending",
        "new_listing",
        "message",
      ],
      reaction_type: ["like", "dislike"],
      release_type: ["single", "ep", "album"],
      saved_item_type: ["post", "listing"],
    },
  },
} as const
