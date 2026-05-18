
create or replace function public.submit_bidder_registration(
  _declared_cap numeric,
  _legal_name text,
  _date_of_birth date,
  _address_line1 text,
  _address_line2 text,
  _city text,
  _region text,
  _postal_code text,
  _country text,
  _phone text,
  _id_document_path text,
  _id_document_back_path text,
  _proof_of_address_path text,
  _proof_of_funds_path text,
  _bank_reference text
) returns public.bidder_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _ceiling numeric := 5000;
  _row public.bidder_registrations;
  _auto boolean := _declared_cap <= _ceiling;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  if _declared_cap is null or _declared_cap <= 0 then
    raise exception 'declared_cap must be positive';
  end if;

  insert into public.bidder_registrations (
    user_id, status, declared_cap, approved_cap,
    legal_name, date_of_birth,
    address_line1, address_line2, city, region, postal_code, country, phone,
    id_document_path, id_document_back_path, proof_of_address_path,
    proof_of_funds_path, bank_reference,
    reviewed_at, expires_at
  ) values (
    _uid,
    case when _auto then 'approved'::bidder_status else 'pending'::bidder_status end,
    _declared_cap,
    case when _auto then _declared_cap else null end,
    _legal_name, _date_of_birth,
    _address_line1, _address_line2, _city, _region, _postal_code, _country, _phone,
    _id_document_path, _id_document_back_path, _proof_of_address_path,
    _proof_of_funds_path, _bank_reference,
    case when _auto then now() else null end,
    case when _auto then now() + interval '12 months' else null end
  )
  on conflict (user_id) do update set
    status = excluded.status,
    declared_cap = excluded.declared_cap,
    approved_cap = excluded.approved_cap,
    legal_name = excluded.legal_name,
    date_of_birth = excluded.date_of_birth,
    address_line1 = excluded.address_line1,
    address_line2 = excluded.address_line2,
    city = excluded.city,
    region = excluded.region,
    postal_code = excluded.postal_code,
    country = excluded.country,
    phone = excluded.phone,
    id_document_path = excluded.id_document_path,
    id_document_back_path = excluded.id_document_back_path,
    proof_of_address_path = excluded.proof_of_address_path,
    proof_of_funds_path = excluded.proof_of_funds_path,
    bank_reference = excluded.bank_reference,
    reviewed_at = excluded.reviewed_at,
    expires_at = excluded.expires_at,
    reviewer_notes = null,
    updated_at = now()
  returning * into _row;

  return _row;
end;
$$;

revoke execute on function public.submit_bidder_registration(numeric,text,date,text,text,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.submit_bidder_registration(numeric,text,date,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
