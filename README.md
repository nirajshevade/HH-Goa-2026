# HH Goa 2026 — Builder Identity

Upload a photo, get a branded **HH Goa 2026** graphic, download it, share it to X.
No signup, no login, no email gate, no manual cropping. One page, one pass.

Two formats, both taken from the approved design:

| Format | Output | Inputs |
| --- | --- | --- |
| **A — PFP Frame** | 1080 × 1080 PNG | photo only |
| **B — Builder ID** | 1080 × 1350 PNG | photo, name, stack/role, optional "currently building" |

> The approved design specifies 1080 × 1350 for Format B, so that is what ships —
> not the 1200 × 1500 in the original brief.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + lint + production build
```

Copy `.env.example` to `.env.local` if you need to change the share defaults.
Locally the app runs with no configuration at all.

> Stop `next dev` before running `npm run check`. Next 16's dev server
> continuously rewrites `.next/dev/types/validator.ts`, which `tsc` is
> configured to read, and a half-written file trips the typecheck.

## Architecture

Composition happens **in the browser**, on a canvas, at full output resolution.
That is what makes it feel instant and it is also the privacy story: **the
user's photo never leaves their device.** There is no upload step, no
round-trip, and no server-side image pipeline to abuse.

```
src/
  app/
    page.tsx                 the one page
    api/share/route.ts       POST a finished graphic -> temporary public URL
    i/[id]/route.ts          serves that graphic as image/png
    s/[id]/page.tsx          share landing page carrying the OG/Twitter tags
  components/                UI only — no drawing code lives here
  lib/
    brand.ts                 colors, dimensions, event copy
    fonts.ts                 next/font + canvas font preloading
    title.ts                 deterministic builder-title engine
    sanitize.ts              user-text hygiene
    filename.ts              download filename slugging
    share.ts                 the X share flow
    image/
      loadImage.ts           decode -> downscale -> locate subject
      heic.ts                HEIC/HEIF sniffing and conversion
    graphics/
      index.ts               generateGraphic() — the single entry point
      renderPfp.ts           renderPfpGraphic()
      renderBuilderCard.ts   renderBuilderCard()
      brandElements.ts       arch, sunburst, गोवा sticker, ticker band
      primitives.ts          renderText(), fitTextSize(), shapes, grain
      fitPhoto.ts            fitPhoto(), detectOrientation(), calculateCrop()
      subject.ts             face/saliency detection
      exportGraphic.ts       exportGraphic(), downloadGraphic()
```

### Photo fitting

No cropper, ever. `calculateCrop()` picks the largest window of the target
aspect ratio that fits inside the source, centres it on a detected focus point,
and clamps it to the image bounds — so aspect ratio is always preserved, the
box is always filled, and an off-centre subject pulls the window until it hits
an edge and then stops.

The focus point comes from, in order:

1. the browser's `FaceDetector`, where it exists (area-weighted across faces, so
   group photos favour the nearest person);
2. a skin-tone + edge-detail saliency pass over a 64px copy — no model, no
   download, no dependency;
3. a fixed slightly-above-centre default, which is the head-room bias the
   approved design used.

None of these can fail the render. A low-confidence saliency reading is blended
back toward the default rather than trusted outright.

### HEIC

iPhone HEIC uploads work. Native decode is tried first (Safari handles HEIC
directly), and only if that fails and the file's *bytes* say HEIF does the app
`import()` the WASM decoder — so the ~1MB converter never loads for the JPEG
majority. The whole thing is invisible: the user picks a photo and gets a PNG.

### Text

Everything the user types is sanitised (control/format characters stripped, bidi
overrides removed, combining marks capped, whitespace collapsed, length limited)
and then drawn through `renderText()`, which shrinks to fit and hard-truncates
with an ellipsis if it still does not. The Builder ID's title pill is sized to
its text, so short and long titles both look deliberate.

Builder titles come from a curated, keyword-keyed table hashed on name + stack.
Same input, same title, every time — no model call, no latency, no cost.

## Sharing to X

A web page cannot attach a local file to X's web composer. The app never
pretends otherwise. Three paths, and the UI states plainly which one happened:

1. **Native share sheet** (`navigator.share` with files): the real PNG is handed
   to the X app as a genuine attachment. **Touch devices only** — desktop Chrome
   and Edge report `canShare({ files }) === true` but open the *Windows* share
   dialog, which cannot reach X, so a button labelled "Share on X" must not go
   down that path.
2. **Preview link** (the desktop path): the finished graphic is uploaded to a
   temporary URL and X opens with the caption plus that link, which unfurls into
   a `summary_large_image` card. The PNG downloads at the same time so it can be
   attached by hand instead.
3. **Caption only**: if the upload fails, X still opens with the caption and the
   UI says to attach the downloaded PNG manually.
4. **Pop-up blocked**: the UI shows a clickable "Open X compose" link with the
   caption already in it.

`#FrameInGoa` is in every caption.

### OG metadata

`/s/<id>` emits `og:title`, `og:description`, `og:image`, `og:type`,
`twitter:card`, `twitter:title`, `twitter:description` and `twitter:image`, with
the image pointing at **that user's generated graphic** — never a generic site
thumbnail. The image URL is absolute, resolved from `NEXT_PUBLIC_SITE_URL` or
the request's forwarded host.

## Storage and privacy

Original photos are never uploaded. Only the finished, already-branded graphic
is stored, and only when the user taps "Share on X" and the browser could not
attach the file directly.

Stored entries:

- get a 128-bit random id (`randomBytes(16)`), so paths are unguessable and
  un-enumerable;
- expire after `SHARE_TTL_SECONDS` (24h by default), enforced on every read;
- are rate-limited per IP by `SHARE_RATE_LIMIT_PER_HOUR`.

### Two backends, picked by configuration

`src/lib/server/shareStore.ts` selects a backend at call time — no code change
between environments:

| `BLOB_READ_WRITE_TOKEN` | Backend | Use |
| --- | --- | --- |
| set | **Vercel Blob** | Serverless / multi-instance. Required on Vercel. |
| unset | **in-process `Map`** | Local dev, single-instance hosts. |

The memory backend also honours `SHARE_STORE_MAX_MB`, evicting oldest first.
It is *not* safe on serverless: the write and the read run in different
instances, so a share link would 404 for the crawler.

The Blob backend keeps no separate database. Everything `/s/<id>` needs is
encoded in the blob's own pathname —
`shares/<id>/<format>/<base64url(name)>.png` — so one prefixed `list()`
recovers the record. Blob has no native TTL, so `expiresAt` is derived from
`uploadedAt` and enforced on read, and `/api/cron/purge` (daily, see
`vercel.json`) does the actual deleting. A missed cron run delays deletion but
never exposes anything, because reads already refuse expired entries.

If the store is unreachable, `POST /api/share` returns 503 and the client
degrades to opening X with the caption alone — sharing never hard-fails.

> The per-IP rate limiter is also in-process, so on serverless it is enforced
> per instance and the effective ceiling is looser than the configured number.
> It is a speed bump against scripted abuse, not an auth boundary.

## Security

The upload endpoint trusts nothing from the client. The declared MIME type,
filename and any client-sent dimensions are ignored; a payload is only stored if
its **bytes** are a real PNG whose IHDR header reports one of the two sizes this
app produces. That rules out SVG, HTML, polyglots and anything else that could
be served back to a browser as something other than an image. Size is checked
against both the declared and the actual length, ids are format-validated before
lookup, responses carry `X-Content-Type-Options: nosniff`, and the id space is
not derivable from anything public.

## Accessibility

Semantic HTML throughout: a real `<form>`, real `<input type="file">` inside
`<label>`, real radio inputs for the format picker (so arrow keys work), one
`<h1>` per screen, labelled fields, `aria-live` on the generating/error/share
states, a 3px yellow `:focus-visible` ring on everything interactive, ≥52px tap
targets, and `prefers-reduced-motion` honoured.

## Deploying to Vercel

1. Push to GitHub, then **Add New → Project** on Vercel and import the repo.
   Framework, build command and output are all detected; nothing to configure.
2. **Storage → Create Database → Blob**, connect it to the project. This sets
   `BLOB_READ_WRITE_TOKEN` automatically, which is what switches the share store
   off the in-memory backend. **Skip this and share links will 404 for X's
   crawler.**
3. Add two environment variables (Production, Preview, Development):
   - `NEXT_PUBLIC_SITE_URL` — your real domain, e.g. `https://hh-goa.vercel.app`.
     OG image URLs must be absolute; without it they fall back to the forwarded
     host, which is right in most cases but not worth leaving to chance.
   - `CRON_SECRET` — any long random string. `/api/cron/purge` refuses every
     request until this is set. Generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
4. Deploy. `vercel.json` registers the daily purge cron at 04:00 UTC.

After the first deploy, paste a `/s/<id>` link into
[X's Card Validator](https://cards-dev.twitter.com/validator) to confirm the
graphic unfurls as the preview image.

## Browser support

Targets iPhone Safari and Android Chrome first, then desktop. Uses
`createImageBitmap` with an `<img>` decode fallback, `canvas.toBlob` with a data
URL fallback, and `dvh` units with `env(safe-area-inset-bottom)` so the footer
clears the home indicator. Inputs are ≥16px so iOS never zooms the viewport.
