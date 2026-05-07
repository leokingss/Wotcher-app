
REVOKE EXECUTE ON FUNCTION public.notify_outbid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers_new_listing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_reaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
