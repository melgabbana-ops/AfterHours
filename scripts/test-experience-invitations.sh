#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL must point to the disposable CI PostgreSQL service}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/experience_invitation_setup.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261121113000_afterhours_invitation_rpc_hardening.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/experience_invitation_assertions.sql
