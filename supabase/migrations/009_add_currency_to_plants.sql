-- Migration 009: Add currency column to plants table
-- Existing plants default to 'EUR'

ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

ALTER TABLE plants
  ADD CONSTRAINT plants_currency_check
  CHECK (currency IN ('EUR', 'USD', 'CLP', 'GBP'));
