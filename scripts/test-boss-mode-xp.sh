#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL must point to the disposable CI PostgreSQL service}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/boss_mode_xp_setup.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261121032837_boss_mode_xp_rewards.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/boss_mode_xp_assertions.sql
