# Slot Game — Scope & Plan

Status: draft v1 — decisions below are starting points, not locked.

## 1. Model

**Sweepstakes casino**, dual-currency: Gold Coins (GC, purchasable play-money,
no cash value) and Sweeps Coins (SC, obtained free via AMOE or as a bonus on
GC purchase, redeemable for cash prizes). This is the Chumba/LuckyLand model —
legal in most US states as a promotional sweepstakes, not a licensed gambling
product, *provided* the "no purchase necessary" path is real and honored.

**Platform:** web-first (installable PWA), mobile app-store presence later
(Apple/Google generally reject sweepstakes-casino apps outright, so mobile
means a browser/PWA experience, not App Store/Play Store distribution — plan
acquisition accordingly, not around app store discovery).

## 2. The pitfalls that actually kill sweepstakes-casino startups

These aren't edge cases — they're the standard failure modes for this
business model, so the plan below is sequenced around them rather than
bolting them on at the end.

1. **Legal structuring is not optional.** You need gaming counsel to draft
   the sweepstakes rules, the AMOE (mail-in alternate entry), Terms of
   Service, and a state-by-state legality opinion *before* SC/redemption go
   live. Budget realistically — this is commonly a five-figure spend, not a
   template you fill in yourself.
2. **Geofencing.** Washington State treats these games as illegal gambling
   outright; Michigan has issued cease-and-desist actions against sweepstakes
   casinos; a few other states restrict or are actively litigating this. You
   must be able to block play/redemption by state and keep that list current
   — this is a live regulatory area, not a one-time launch checklist item.
3. **Payment processors will drop you.** Standard Stripe/PayPal terms
   prohibit gambling-adjacent products; "redeemable for cash" is the trigger.
   You need a high-risk-friendly processor relationship for the SC/redemption
   side, secured *before* you promise users real-money redemption. Keep a
   backup processor — these relationships get revoked.
4. **KYC/AML on redemption.** Before paying anyone real money out, you need
   identity verification (Persona/Onfido/Stripe Identity) and basic AML
   controls. This is also your main defense against...
5. **Fraud and multi-accounting.** Free SC is a magnet for bonus-abuse rings
   running dozens of fake accounts to farm redemptions. This is the single
   biggest economic threat to a small sweepstakes operator — device
   fingerprinting, velocity limits, and manual review queues need to exist
   before you scale acquisition, not after you notice the losses.
6. **No app-store distribution.** Marketing budget has to assume paid
   acquisition (ads/affiliates) and web/PWA growth loops, not organic app
   store search.
7. **Responsible-gaming basics are expected by processors and regulators
   even without a gambling license**: 18+/21+ age gate, self-exclusion,
   session/spend limits, links to problem-gambling resources.

**Consequence for sequencing:** build and validate the *game* (is it fun,
does the server-authoritative economy work, do people come back) on Gold
Coins only first. Do not turn on Sweeps Coins, redemption, or real-money
paths until legal counsel, a payment processor, and KYC/fraud tooling are
actually in place. Retrofitting compliance onto a live redemption product
is far more expensive than sequencing it up front.

## 3. Game design (v1 — one game, done well)

- Format: 5×3 reels, 20–25 paylines (or "ways to win"), standard
  low/mid/high symbols + wild + scatter, one bonus feature (free spins with
  a multiplier) — no second bonus mechanic for v1.
- Original theme (not licensed IP — avoids licensing cost/risk entirely).
  Placeholder-quality art is fine for v1; art pass comes after the loop is
  proven fun.
- Configurable, disclosed theoretical RTP (return-to-player) — pick a target
  (e.g. 94–96%), and be able to state it. This matters for both player trust
  and eventual regulatory/processor scrutiny.
- One game in v1, not a lobby of games — a multi-game lobby is a scale
  decision for later, not an MVP requirement.

## 4. Architecture

**Non-negotiable principle:** the client never determines outcomes or holds
the source of truth for balances. All spins are resolved server-side with a
cryptographically secure RNG; the client only renders the result. Every
currency movement (purchase, spin, win, redemption) is an immutable
double-entry ledger row — this is what makes the system auditable when a
processor, regulator, or player disputes a balance.

- **Frontend:** TypeScript + PixiJS for the reel canvas (industry-standard
  choice for slot games — fast WebGL 2D, good control over reel/symbol
  animation), with a thin React shell around it for lobby/wallet/settings.
  PixiJS renders in a `<canvas>`, so the same build works as an installable
  PWA on mobile browsers without needing a native app-store build.
- **Backend:** Node.js + TypeScript (Fastify), Postgres for accounts and the
  ledger, Redis for sessions/rate-limiting. Server-side RNG via Node's
  `crypto` (cryptographically secure), never `Math.random`.
- **Hosting:** frontend on Vercel; backend + Postgres on Render/Fly.io/Railway
  to start (a VPS/AWS migration is a later-scale problem, not a v1 one).
- **Payments:** Stripe is fine for GC-only virtual currency sales in Phase 1
  (no cash redemption = not the trigger that gets accounts flagged). The
  high-risk processor is only needed once SC redemption goes live in Phase 3.

## 5. Roadmap

| Phase | Scope | Gate to move on |
|---|---|---|
| 0 — Legal groundwork | Entity/state of incorporation, gaming counsel engaged, sweepstakes rules + AMOE + ToS drafted, initial state exclusion list | Counsel sign-off |
| 1 — Core game (GC only) | Server-authoritative slot engine, one theme, GC purchase via Stripe, deployed, invite-only playtest | Game is fun, economy holds up under test |
| 2 — Product hardening | Accounts/auth, analytics, responsible-gaming controls (age gate, limits, self-exclusion), basic fraud signals (device fingerprint, velocity limits) | Ready to accept real users at small scale |
| 3 — Sweeps Coins + redemption | Dual currency, AMOE flow, KYC provider integration, high-risk payment processor live, redemption flow | Legal + processor + KYC/fraud all confirmed live — not before |
| 4 — Growth | Mobile PWA polish, paid acquisition, additional games/themes | — |

## 6. Immediate next steps

1. Confirm this scope (theme, RTP target, paylines) or redirect it.
2. Scaffold the repo: frontend (Vite + React + PixiJS) and backend
   (Fastify + Postgres) as two packages in this monorepo.
3. Build the Phase 1 spin loop end-to-end (server RNG → ledger → client
   render) as the first working slice.
