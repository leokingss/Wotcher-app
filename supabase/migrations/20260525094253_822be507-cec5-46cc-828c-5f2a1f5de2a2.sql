
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'mention';

CREATE OR REPLACE FUNCTION public.notify_story_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sticker jsonb;
  mentioned_username text;
  mentioned_user_id uuid;
BEGIN
  IF NEW.stickers IS NULL OR jsonb_typeof(NEW.stickers) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR sticker IN SELECT * FROM jsonb_array_elements(NEW.stickers)
  LOOP
    IF sticker->>'type' = 'mention' THEN
      mentioned_username := lower(trim(both '@' from coalesce(sticker->>'username', '')));
      IF mentioned_username = '' THEN CONTINUE; END IF;

      SELECT id INTO mentioned_user_id
      FROM public.profiles
      WHERE lower(username) = mentioned_username
      LIMIT 1;

      IF mentioned_user_id IS NULL OR mentioned_user_id = NEW.user_id THEN
        CONTINUE;
      END IF;

      INSERT INTO public.notifications (user_id, actor_id, type, metadata)
      VALUES (
        mentioned_user_id,
        NEW.user_id,
        'mention',
        jsonb_build_object(
          'story_id', NEW.id,
          'media_type', NEW.media_type,
          'media_url', NEW.media_url
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_story_mentions ON public.stories;
CREATE TRIGGER trg_notify_story_mentions
AFTER INSERT ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.notify_story_mentions();
