-- Riviera Aesthetic — subscriber, entitlement and progress.
--
-- Run once against the Neon database (SQL editor or psql). It is idempotent,
-- so re-running it is safe.
--
-- WHAT IS DELIBERATELY NOT HERE. There is no lessons table: lessons live in
-- content/course.json and are read at build time by src/lib/course.ts, exactly
-- like blog posts. Git stays the CMS. This database holds only the things git
-- cannot: who paid, until when, and how far they have watched.
--
-- No RLS either. Every query in this app runs server-side through a route
-- handler that has already checked the session; the browser never holds a
-- database credential. RLS would guard a door nobody uses.

CREATE TABLE IF NOT EXISTS subscriber (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Stored already lower-cased and trimmed; the app normalises on the way in.
  -- Addresses are the only identity here, so the uniqueness has to be real.
  email      TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND position('@' IN email) > 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per subscriber. The payment provider is the source of truth; this is
-- a local mirror kept current by the webhook, so the hot path is one indexed
-- SELECT instead of a call to iyzico on every page view.
CREATE TABLE IF NOT EXISTS subscription (
  subscriber_id      BIGINT PRIMARY KEY REFERENCES subscriber(id) ON DELETE CASCADE,
  status             TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  provider           TEXT NOT NULL,
  -- iyzico's subscriptionReferenceCode. Its API and its webhooks key on this
  -- and never return the customer's email, so this mapping is written exactly
  -- once, at checkout, and cannot be reconstructed afterwards. Losing it means
  -- losing the link between a payment and a person.
  provider_ref       TEXT NOT NULL UNIQUE,
  current_period_end TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The entitlement check, run on every lesson view, is exactly:
--   SELECT 1 FROM subscription
--    WHERE subscriber_id = $1 AND status = 'active' AND current_period_end > now()
CREATE INDEX IF NOT EXISTS subscription_active_idx
  ON subscription (subscriber_id, current_period_end)
  WHERE status = 'active';

-- Magic links. The row is the single-use guarantee: verification is one
-- atomic DELETE ... RETURNING, so two concurrent redemptions of the same link
-- cannot both succeed. Only the SHA-256 of the token is stored — a leaked
-- database dump must not contain working login links.
CREATE TABLE IF NOT EXISTS login_token (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Rate limiting reads this: count a sender's unexpired tokens instead of
-- keeping a second table just to hold counters.
CREATE INDEX IF NOT EXISTS login_token_email_idx ON login_token (email, expires_at);

-- Webhooks retry. Without this a duplicate delivery would extend a paid period
-- twice, silently giving away a month.
CREATE TABLE IF NOT EXISTS provider_event (
  provider     TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);

-- lesson_id is the slug from content/course.json, not a foreign key — lessons
-- are versioned in git and a renamed slug should lose its progress rather than
-- break a write.
CREATE TABLE IF NOT EXISTS lesson_progress (
  subscriber_id    BIGINT NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
  lesson_id        TEXT NOT NULL,
  -- Resume position. Seconds, not milliseconds, matching how the player
  -- reports currentTime and how Bunny expresses expiry.
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, lesson_id)
);

-- KVKK erasure: every table above cascades from subscriber, so one
--   DELETE FROM subscriber WHERE lower(email) = $1
-- satisfies a deletion request in full. login_token is keyed by email rather
-- than subscriber_id, so it needs its own delete:
--   DELETE FROM login_token WHERE email = $1
