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
      circle_members: {
        Row: {
          circle: Database["public"]["Enums"]["friend_circle"]
          created_at: string
          id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          circle: Database["public"]["Enums"]["friend_circle"]
          created_at?: string
          id?: string
          member_id: string
          owner_id: string
        }
        Update: {
          circle?: Database["public"]["Enums"]["friend_circle"]
          created_at?: string
          id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          post_id: string | null
          text: string
          track_id: string | null
          updated_at: string
          user_id: string
          video_id: string | null
          voice_duration_seconds: number | null
          voice_url: string | null
        }
        Insert: {
          created_at?: string
          edited?: boolean
          id?: string
          post_id?: string | null
          text: string
          track_id?: string | null
          updated_at?: string
          user_id: string
          video_id?: string | null
          voice_duration_seconds?: number | null
          voice_url?: string | null
        }
        Update: {
          created_at?: string
          edited?: boolean
          id?: string
          post_id?: string | null
          text?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
          voice_duration_seconds?: number | null
          voice_url?: string | null
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
      drop_claims: {
        Row: {
          created_at: string
          drop_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drop_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drop_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_claims_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          access: string
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          media_url: string | null
          price_cents: number | null
          public_at: string | null
          releases_at: string
          title: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          access?: string
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          media_url?: string | null
          price_cents?: number | null
          public_at?: string | null
          releases_at?: string
          title: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          access?: string
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          media_url?: string | null
          price_cents?: number | null
          public_at?: string | null
          releases_at?: string
          title?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drops_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drops_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
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
      group_buy_members: {
        Row: {
          group_buy_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_buy_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_buy_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_buy_members_group_buy_id_fkey"
            columns: ["group_buy_id"]
            isOneToOne: false
            referencedRelation: "group_buys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_buy_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_buys: {
        Row: {
          created_at: string
          creator_id: string
          ends_at: string
          group_price_cents: number
          id: string
          listing_id: string | null
          solo_price_cents: number
          status: string
          target_members: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          ends_at: string
          group_price_cents: number
          id?: string
          listing_id?: string | null
          solo_price_cents: number
          status?: string
          target_members: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          ends_at?: string
          group_price_cents?: number
          id?: string
          listing_id?: string | null
          solo_price_cents?: number
          status?: string
          target_members?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_buys_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_buys_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          invite_id: string
          ip: string | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          invite_id: string
          ip?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          invite_id?: string
          ip?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_events_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_type: string
          invitee_email: string | null
          invitee_phone: string | null
          invitee_user_id: string | null
          inviter_user_id: string
          metadata: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          used_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_type: string
          invitee_email?: string | null
          invitee_phone?: string | null
          invitee_user_id?: string | null
          inviter_user_id: string
          metadata?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          used_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_type?: string
          invitee_email?: string | null
          invitee_phone?: string | null
          invitee_user_id?: string | null
          inviter_user_id?: string
          metadata?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          used_at?: string | null
        }
        Relationships: []
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
            foreignKeyName: "listings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat: {
        Row: {
          amount_cents: number | null
          body: string | null
          created_at: string
          id: string
          kind: string
          room_id: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          room_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_rooms: {
        Row: {
          bidder_count: number
          cover_url: string | null
          created_at: string
          ends_at: string | null
          host_id: string
          id: string
          is_live: boolean
          kind: string
          listing_id: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          bidder_count?: number
          cover_url?: string | null
          created_at?: string
          ends_at?: string | null
          host_id: string
          id?: string
          is_live?: boolean
          kind: string
          listing_id?: string | null
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          bidder_count?: number
          cover_url?: string | null
          created_at?: string
          ends_at?: string | null
          host_id?: string
          id?: string
          is_live?: boolean
          kind?: string
          listing_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_rooms_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          formatted_address: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          place_type: string | null
          provider: string
          provider_place_id: string
          region: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          place_type?: string | null
          provider: string
          provider_place_id: string
          region?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          place_type?: string | null
          provider?: string
          provider_place_id?: string
          region?: string | null
        }
        Relationships: []
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
          story_ref: Json | null
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
          story_ref?: Json | null
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
          story_ref?: Json | null
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
      packet_shares: {
        Row: {
          amount_cents: number
          claimed_at: string | null
          claimed_by: string | null
          id: string
          packet_id: string
          track_id: string | null
        }
        Insert: {
          amount_cents: number
          claimed_at?: string | null
          claimed_by?: string | null
          id?: string
          packet_id: string
          track_id?: string | null
        }
        Update: {
          amount_cents?: number
          claimed_at?: string | null
          claimed_by?: string | null
          id?: string
          packet_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packet_shares_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packet_shares_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "red_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packet_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
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
          location_id: string | null
          media_type: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          location?: string | null
          location_id?: string | null
          media_type?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          location?: string | null
          location_id?: string | null
          media_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predict_picks: {
        Row: {
          created_at: string
          direction: string
          id: string
          resolved: boolean
          track_id: string
          user_id: string
          was_correct: boolean | null
          week_start: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          resolved?: boolean
          track_id: string
          user_id: string
          was_correct?: boolean | null
          week_start: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          resolved?: boolean
          track_id?: string
          user_id?: string
          was_correct?: boolean | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "predict_picks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predict_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predict_scores: {
        Row: {
          best_streak: number
          current_streak: number
          last_week: string | null
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          last_week?: string | null
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          last_week?: string | null
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predict_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          feed_mode: string
          id: string
          invite_allowance: number
          location_id: string | null
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
          feed_mode?: string
          id: string
          invite_allowance?: number
          location_id?: string | null
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
          feed_mode?: string
          id?: string
          invite_allowance?: number
          location_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      red_packets: {
        Row: {
          audience: string
          created_at: string
          creator_id: string
          id: string
          shares: number
          status: string
          title: string | null
          total_cents: number
        }
        Insert: {
          audience?: string
          created_at?: string
          creator_id: string
          id?: string
          shares: number
          status?: string
          title?: string | null
          total_cents: number
        }
        Update: {
          audience?: string
          created_at?: string
          creator_id?: string
          id?: string
          shares?: number
          status?: string
          title?: string | null
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "red_packets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_relationships: {
        Row: {
          created_at: string
          id: string
          invite_id: string
          invitee_user_id: string
          inviter_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_id: string
          invitee_user_id: string
          inviter_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_id?: string
          invitee_user_id?: string
          inviter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_relationships_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
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
      stories: {
        Row: {
          ar_effect_id: string | null
          audience_circle: Database["public"]["Enums"]["friend_circle"] | null
          caption: string | null
          created_at: string
          expires_at: string
          filter_id: string | null
          filter_intensity: number
          id: string
          location_id: string | null
          media_type: Database["public"]["Enums"]["story_media_type"]
          media_url: string
          overlays_json: Json | null
          stickers: Json
          track_artist: string | null
          track_title: string | null
          user_id: string
        }
        Insert: {
          ar_effect_id?: string | null
          audience_circle?: Database["public"]["Enums"]["friend_circle"] | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          filter_id?: string | null
          filter_intensity?: number
          id?: string
          location_id?: string | null
          media_type: Database["public"]["Enums"]["story_media_type"]
          media_url: string
          overlays_json?: Json | null
          stickers?: Json
          track_artist?: string | null
          track_title?: string | null
          user_id: string
        }
        Update: {
          ar_effect_id?: string | null
          audience_circle?: Database["public"]["Enums"]["friend_circle"] | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          filter_id?: string | null
          filter_intensity?: number
          id?: string
          location_id?: string | null
          media_type?: Database["public"]["Enums"]["story_media_type"]
          media_url?: string
          overlays_json?: Json | null
          stickers?: Json
          track_artist?: string | null
          track_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_highlight_items: {
        Row: {
          caption: string | null
          captured_at: string
          created_at: string
          filter_id: string | null
          filter_intensity: number
          highlight_id: string
          id: string
          media_type: Database["public"]["Enums"]["story_media_type"]
          media_url: string
          original_story_id: string | null
          position: number
          stickers: Json
          track_artist: string | null
          track_title: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string
          created_at?: string
          filter_id?: string | null
          filter_intensity?: number
          highlight_id: string
          id?: string
          media_type: Database["public"]["Enums"]["story_media_type"]
          media_url: string
          original_story_id?: string | null
          position?: number
          stickers?: Json
          track_artist?: string | null
          track_title?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          captured_at?: string
          created_at?: string
          filter_id?: string | null
          filter_intensity?: number
          highlight_id?: string
          id?: string
          media_type?: Database["public"]["Enums"]["story_media_type"]
          media_url?: string
          original_story_id?: string | null
          position?: number
          stickers?: Json
          track_artist?: string | null
          track_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_highlight_items_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "story_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_highlight_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_highlights: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_poll_votes: {
        Row: {
          created_at: string
          option_index: number
          sticker_id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_index: number
          sticker_id: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_index?: number
          sticker_id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_question_replies: {
        Row: {
          created_at: string
          id: string
          sticker_id: string
          story_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sticker_id: string
          story_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sticker_id?: string
          story_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_question_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_count: number
          last_check_in: string | null
          longest_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_count?: number
          last_check_in?: string | null
          longest_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_count?: number
          last_check_in?: string | null
          longest_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_favorite_filters: {
        Row: {
          created_at: string
          filter_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_id?: string
          user_id?: string
        }
        Relationships: []
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
          {
            foreignKeyName: "videos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          balance_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          counterparty_id: string | null
          created_at: string
          id: string
          kind: string
          label: string
          meta: Json | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          counterparty_id?: string | null
          created_at?: string
          id?: string
          kind: string
          label: string
          meta?: Json | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          counterparty_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          label?: string
          meta?: Json | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
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
      claim_invite: {
        Args: { _code: string }
        Returns: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_type: string
          invitee_email: string | null
          invitee_phone: string | null
          invitee_user_id: string | null
          inviter_user_id: string
          metadata: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          used_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_expired_stories: { Args: never; Returns: number }
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
      consume_invite: {
        Args: { _code: string }
        Returns: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_type: string
          invitee_email: string | null
          invitee_phone: string | null
          invitee_user_id: string | null
          inviter_user_id: string
          metadata: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          used_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invite: {
        Args: {
          _invite_type: string
          _invitee_email?: string
          _invitee_phone?: string
        }
        Returns: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_type: string
          invitee_email: string | null
          invitee_phone: string | null
          invitee_user_id: string | null
          inviter_user_id: string
          metadata: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          used_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      generate_invite_code: { Args: never; Returns: string }
      get_buyer_shipping: { Args: { _listing_id: string }; Returns: Json }
      get_or_create_dm: { Args: { _other: string }; Returns: string }
      grant_extra_invites: {
        Args: { _extra: number; _user_id: string }
        Returns: number
      }
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
      invites_remaining: { Args: { _user_id: string }; Returns: number }
      is_artist: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      is_in_circle: {
        Args: {
          _circle: Database["public"]["Enums"]["friend_circle"]
          _member_id: string
          _owner_id: string
        }
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
          location_id: string | null
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
      revoke_invite: {
        Args: { _invite_id: string }
        Returns: {
          claimed_at: string | null
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_type: string
          invitee_email: string | null
          invitee_phone: string | null
          invitee_user_id: string | null
          inviter_user_id: string
          metadata: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          used_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      story_poll_tally: {
        Args: { _sticker_id: string; _story_id: string }
        Returns: {
          option_index: number
          votes: number
        }[]
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
      validate_invite_code: {
        Args: { _code: string; _email?: string; _phone?: string }
        Returns: {
          invite_id: string
          inviter_username: string
          reason: string
          valid: boolean
        }[]
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
      friend_circle: "private" | "family" | "friends" | "groups"
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
        | "mention"
      reaction_type: "like" | "dislike"
      release_type: "single" | "ep" | "album"
      saved_item_type: "post" | "listing"
      story_media_type: "photo" | "video" | "music"
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
      friend_circle: ["private", "family", "friends", "groups"],
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
        "mention",
      ],
      reaction_type: ["like", "dislike"],
      release_type: ["single", "ep", "album"],
      saved_item_type: ["post", "listing"],
      story_media_type: ["photo", "video", "music"],
    },
  },
} as const
