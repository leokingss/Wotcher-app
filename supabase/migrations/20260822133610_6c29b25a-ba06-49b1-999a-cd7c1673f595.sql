CREATE OR REPLACE FUNCTION public.story_poll_tally(_story_id uuid, _sticker_id text)
RETURNS TABLE(option_index smallint, votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT v.option_index, COUNT(*)::bigint
  FROM public.story_poll_votes v
  WHERE v.story_id = _story_id AND v.sticker_id = _sticker_id
  GROUP BY v.option_index
$$;
REVOKE ALL ON FUNCTION public.story_poll_tally(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.story_poll_tally(uuid, text) TO authenticated;