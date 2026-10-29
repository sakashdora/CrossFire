-- Adds the provisioned VIP guest login role. PostgreSQL requires a new enum value
-- to be committed before any statement uses it, so this file is applied on its own
-- transaction before 20261030090100_accounts_registration_qr.sql.
alter type public.user_role add value if not exists 'vip_guest';
