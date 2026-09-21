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
8. **Payout liability from high volatility.** A high-volatility game pays
   rarely but big — and because SC redeems for real cash, a rare huge hit is
   a real cash obligation, not just a number on screen. Two standard
   mitigations, both needed before SC/redemption go live: a hard **max-win
   cap** per spin (industry norm is roughly 5,000x–10,000x the stake, tuned
   during RTP simulation), and a funded **reserve/bankroll policy** sized to
   cover plausible payout swings — some states expect operators to show they
   can actually cover redemptions. This is a Phase 0/3 legal + finance item,
   not something to discover after a big win happens.

**Consequence for sequencing:** build and validate the *game* (is it fun,
does the server-authoritative economy work, do people come back) on Gold
Coins only first. Do not turn on Sweeps Coins, redemption, or real-money
paths until legal counsel, a payment processor, and KYC/fraud tooling are
actually in place. Retrofitting compliance onto a live redemption product
is far more expensive than sequencing it up front.

## 3. Game design (v1 — one game, done well)

- **Grid & pay mechanic:** 5×5 grid, **cluster pays** — a win is 5+ same
  symbols connected orthogonally (not diagonally) anywhere on the grid, not
  fixed paylines. This is the standard pairing for tumbling wins (see
  Reactoonz/Gemix-style games); "ways/payline" math doesn't fit a tumble
  mechanic as cleanly since the grid contents change mid-evaluation.
- **Tumbling (cascading) wins:** on a win, the winning symbols clear, symbols
  above drop to fill the gaps, new symbols fall in from the top, and the
  grid re-evaluates for new wins — chaining until a spin produces no more
  wins. Each step in the chain is a "step multiplier" opportunity (see
  below).
- **Volatility: high.** Concretely this means the paytable is weighted
  toward rare, large clusters and rare big multipliers rather than frequent
  small wins — target base-game hit frequency in the ~20–25% range (vs.
  ~30–40% for a medium-volatility game). This is tuned by Monte Carlo
  simulation against the paytable and multiplier tables, not by the RNG —
  see the max-win cap in the pitfalls section above, which volatility work
  must respect.
- **Multiplier spinner (bonus feature):** a wheel-style bonus that sets a
  multiplier applied to a round's winnings. Proposed default: 3+ scatter
  symbols trigger a free-spins round; each tumble step during free spins
  adds to a multiplier meter, and at the end of the round a wheel spin
  determines a final multiplier (e.g. weighted across 2x–100x) applied to
  the round's total win. This is one bonus mechanic, not two — keeps v1
  scope to "base game + one bonus round," per the no-second-bonus-mechanic
  goal below. Exact trigger odds and wheel-segment weights get set during
  RTP simulation, not guessed.
- **Theme: spiders, eerie palette** (original IP — no licensing cost/risk).
  Reading "Erie colors" as *eerie* — a dark, desaturated palette (charcoal/
  near-black background, muted violet/sickly green/bone-white accents,
  webbing-silver highlights) rather than a literal Lake Erie teal/blue
  scheme. Flag this now in case the intent was the lake's colors instead —
  cheap to redirect before any art gets made, expensive after.
- **Win effect:** on a win, spiders visually swarm across the board/screen,
  scaling with win size (a few spiders skittering across for a small win,
  the screen crawling with them for a big one, full takeover for the
  wheel-multiplier bonus). Purely presentational — sits in the client's
  render layer, no effect on math/RTP.
- **Phantom spider easter egg:** a translucent/ghostly spider that appears
  during idle moments and animates toward the player's pointer/finger
  position, tracking touch or cursor movement. Proposed default for v1:
  **cosmetic only** — an atmosphere/engagement touch with no payout effect,
  which keeps it out of the RTP model and the legal-disclosure surface
  entirely. It can be upgraded later into a real bonus trigger (e.g., tap
  it before it reaches the edge for a small reward), but that would need to
  be priced into the RTP simulation and disclosed like any other feature —
  worth doing deliberately in a later pass, not by default now.
- Placeholder-quality art/animation is fine for v1; a real art and motion
  pass comes after the win-evaluation loop and win/phantom-spider effects
  are proven fun, not before.
- **RTP target: 95%**, provisional pending the Monte Carlo simulator (an
  explicit, stated number to design and build against beats leaving it
  open — cluster-pay + tumble + wheel-multiplier math is meaningfully more
  complex to simulate than a flat payline game, so budget real time for a
  standalone simulator that runs against the same win-evaluation code the
  server uses before trusting any RTP number in production).
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
  ledger, Redis for sessions/rate-limiting.
- **RNG — CSPRNG, not quantum, for v1:** every certified online casino
  (regulators/testing labs like GLI, iTech Labs, BMM) runs on a
  cryptographically secure PRNG (Node's `crypto.randomInt`, never
  `Math.random`), and that's what's actually certified and trusted, not the
  physical source of entropy. A CSPRNG is computationally indistinguishable
  from "true" randomness — no regulator or lab asks for quantum-sourced
  entropy, so it buys no compliance or fairness credibility that a good
  CSPRNG doesn't already have.
  Real quantum RNG (entropy from quantum phenomena — ANU's QRNG, ID
  Quantique hardware) does exist, but calling an external quantum API
  *per spin* would put a third-party network call and its uptime on the
  critical path of every spin, and free/public QRNG APIs aren't built for
  commercial request volume. If "quantum" matters as a real (not just
  marketing) differentiator later, the right pattern is to periodically
  feed quantum entropy from a commercial QRNG vendor into the server's
  CSPRNG entropy pool — the same approach Cloudflare uses with its lava-lamp
  wall — so you get a genuine quantum contribution without making spin
  resolution depend on a live external call. That's a Phase 2+/marketing
  item; v1 ships on a plain server-side CSPRNG. Either way, budget for
  independent third-party RNG certification (GLI/iTech Labs/BMM) before
  scaling — that credential, not the entropy source, is what processors,
  regulators, and skeptical players actually check.
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

1. Confirm the "eerie" vs. Lake Erie palette reading above.
2. Scaffold the repo: frontend (Vite + React + PixiJS) and backend
   (Fastify + Postgres) as two packages in this monorepo.
3. Build the win-evaluation core first and in isolation (cluster detection
   + tumble/cascade + wheel-multiplier logic, framework-agnostic, unit
   tested) — this is what both the server's spin resolution and the offline
   RTP simulator will run against, so it needs to exist before either does.
4. Build the Phase 1 spin loop end-to-end (server CSPRNG → win evaluation
   → ledger → client render/animation) as the first playable slice.
