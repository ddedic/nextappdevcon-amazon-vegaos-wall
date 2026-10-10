# Running a booth

What the people at the booth need to know on the day: the remote, the Control panel, and what BoothWall does to keep a public screen safe.

## The TV remote

| Button     | What it does                                                                |
| ---------- | --------------------------------------------------------------------------- |
| OK         | Opens the spotlight, a full-screen slideshow that keeps advancing           |
| ← / →      | Steps through every approved photo, newest first, not only the 11 on screen |
| Back       | Closes the spotlight. On the wall, press it twice to exit                   |
| Play/Pause | Pauses or resumes the slideshow                                             |

## The Control panel

It lives at `/control`, opens with the passcode that `pnpm boothwall setup` sets, and isn't linked from anywhere. It's made for a phone:

| Tab      | What it does                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Queue    | New uploads, oldest first. Approve or reject each one, or approve them all                                     |
| Photos   | Every photo. Filter by status and category, search captions, sort, and hide, show, edit or delete, one or many |
| Remote   | The TV remote, for every screen showing the wall                                                               |
| Overview | Live numbers: on the wall, waiting, hidden, uploads today, and per category                                    |

Hiding takes a photo off the wall without deleting it, and edits reach the screens straight away. The old `/admin` address still redirects here.

If someone at the booth has a laptop, `pnpm remote` gives them a bigger remote in the browser.

## Privacy and safety

It runs in public with real people's faces on it, so it errs on the careful side:

- **Approve first.** Nothing shows on a screen until someone at the booth approves it.
- **Consent and control.** A required consent box, a delete link for the person who uploaded, and automatic deletion after `retentionDays` (14 by default).
- **No raw IPs.** IPs are hashed with a daily salt and only used for rate limits. No accounts, no tracking.
- **Hard to abuse.** Upload caps sized for venue Wi-Fi, file type checks on the actual bytes, no hotlinking, private pending photos and a passcode lockout. The details are in [How it's built](architecture.md#abuse-protection).

## Before the doors open

- Open `/control` on the phone you'll use at the booth and unlock it once.
- Scan the QR code on the TV with a second phone and send a test photo, then approve it and check it lands.
- If the wall will run all day on a Fire TV Stick, do a long test run first. The [Vega OS notes](vega-os-notes.md#performance-on-vega-os) have what's known so far about memory over long runs.
