# Azeebo+ — UI Page Design Prompts

> These prompts are for visual/UI designers or AI design tools to reproduce each screen.
> They cover layout, visual language, color, typography, imagery, and component specs — not implementation code.

---

## Brand Design System (Applied Across All Pages)

**Color Palette**
- `#E8420A` — Azeebo Orange (primary CTA, logo accent, highlights)
- `#CC1C1C` — Deep Red (buttons, active states, glow effects)
- `#1A0A0A` — Near-Black (primary background on auth/utility screens)
- `#0D3B2E` — Forest Dark Green (marketing/hero screen background)
- `#FFFFFF` — White (primary text, UI card text)
- `#2A2A2A` — Surface Dark (card backgrounds, input fields)
- `rgba(255,255,255,0.08)` — Frosted Glass (card panels with blur effect)

**Typography**
- Display / Headings: Bold sans-serif (Montserrat ExtraBold or Inter Black) — used at large sizes for marketing copy
- UI Labels / Body: Medium-weight sans-serif (Inter Medium / DM Sans) — clean, legible
- Logo: Custom "azeebo" wordmark in orange with a "+" superscript in the same orange; slightly rounded letterforms

**Signature Design Element**
Frosted glass card panels with a white luminous border glow (`box-shadow: 0 0 20px rgba(255,255,255,0.3)`) floating over full-bleed photographic or dramatic backgrounds. This glass panel convention is the unifying UI motif.

**Button Style**
- Primary: Pill-shaped, solid `#CC1C1C` red, white bold text, full-width inside cards
- Secondary / Social: Rounded rectangle, white or dark with brand icon (Google/Apple)
- Hover glow: subtle red ambient glow beneath primary buttons

---

## PAGE 1 — Splash / Welcome Hero Screen (Green)

**Context:** First impression screen, shown before login. Marketing-facing.

**Layout:** Full-bleed dark forest-green background (`#0D3B2E`). Center composition: a hand holding a smartphone in portrait orientation. The phone screen displays a collage of Nigerian entertainment content — Wizkid, Tems, Super Eagles, Nigerian culture imagery — with an orange "GET STARTED" CTA button on the phone screen itself.

Surrounding the phone, 6 floating category cards orbit in a loose, asymmetric arrangement (3 left, 3 right). Each card is a rounded rectangle with a semi-transparent dark background, a small square thumbnail image on one side, and two lines of bold white text (category + subcategory + italic descriptor text).

**Category Cards (left side, stacked vertically):**
1. Music / Afrobeats — Wande Coal thumbnail
2. Movies / Nollywood — Jenevive Nnaji thumbnail
3. Sports / Super Eagles — Matches thumbnail (football action shot)

**Category Cards (right side, stacked vertically):**
4. Culture Heritage — Osun Osogbo thumbnail
5. Comedy / Taooma — Laugh thumbnail
6. Creators / Vloggers — Live Stream thumbnail

**Top Left:** Azeebo logo (white wordmark + orange "+" star) on dark green

**Typography on Hero:** Inside the phone screen, three lines of centered white text:
- "Ekaabo" (Yoruba)
- "Sannu Da Zuwa" (Hausa)
- "Welcome Home" (English)
Set in bold sans-serif, moderate size, celebrating multilingual Nigerian identity.

**Mood:** Warm, inviting, culturally rich. Deep green feels premium and grounded in nature/Nigeria.

---

## PAGE 2 — Login Screen

**Context:** Returning user sign-in. Split layout: cinematic photo left, glass card right.

**Layout:** Two-column, roughly 60/40 split.

**Left Panel (60%):** Full-bleed atmospheric photo of three Nigerian creatives in a dark studio setting — guitarist in Ankara print, female content creator with camera rig, male in streetwear hoodie. Dramatic warm amber studio lighting. Large bold white headline overlaid bottom-left:
> "Explore Nigerian Entertainment  
> Like Never Before"
Three lines, massive weight, left-aligned.

**Right Panel (40%):** Frosted glass card, dark background (`rgba(20,10,10,0.85)`), white luminous border glow. Centered content:
- Title: "Welcome" — white, bold, large
- Input: "Phone Number" label → input field with Nigerian flag emoji + "+234" prefix, white text on dark field, red left-border accent when active
- Input: "Enter your password" label → password field with "Hide/Show" toggle (eye icon, right-aligned)
- CTA Button: Full-width red pill "Login to Azeebo+"
- Link: "Forgot your password?" — small grey text, center-aligned
- Divider: "— OR CONTINUE WITH —" in small caps grey
- Social Button 1: White rounded rect — Google "G" logo + "Continue with Google"
- Social Button 2: Dark rounded rect — Apple logo + "Continue with Apple"
- Footer: "Don't have an account. **Sign up!**" — grey + bold white link

**Top Left:** Azeebo logo (orange + white on dark overlay)

---

## PAGE 3 — Registration Screen (Step 1: Your Details)

**Context:** New user account creation, step 1 of multi-step flow.

**Layout:** Same 60/40 split as Login.

**Left Panel (60%):** Full-bleed photo of a joyful group of young Nigerian creatives in a content studio — laughter, energy, cameras, laptops, headphones. Warm amber-orange lighting. Bold white text overlaid bottom-left:
> "Empowering  
> Nigeria's Creative  
> Renaissance"
Three lines, heavy weight.

**Right Panel (40%):** Frosted glass dark card with glow border. Content:
- Title: "Create Your Azeebo+ Account" — white bold
- Subtitle: "STEP 1: Your Details" — small, all caps, red/orange accent text
- Input: "FULL NAME" label (small caps, grey) → field with placeholder "Adebayo Williams"
- Input: "EMAIL ADDRESS" label → same style
- Input: "PASSWORD" label → field with "Hide/Show" toggle eye icon right
- Checkbox row: small square checkbox + "I agree to the terms of services and privacy policy" in small grey text
- Red ambient glow emanating from bottom of card (atmospheric depth effect)
- CTA: Full-width red pill "Continue"
- Footer: "Already have an account. **Sign in.**"

---

## PAGE 4 — OTP Verification Screen

**Context:** SMS code verification step after registration.

**Layout:** Full-screen centered modal. No photo background — instead a dark, near-black background with a subtle teal/blue abstract pattern overlay (network icons, doodles, tech symbols at very low opacity).

**Center Card:** Rounded dark card (~600px wide), slightly elevated. Content:
- Title: "Verify Your Identity" — white, bold, large
- Subtitle: "Enter your 6 digits verification code sent to your +234 801 234 5678" — small grey text, centered, two lines
- OTP Input Row: 6 individual square input boxes, each with a single digit, white text on dark bordered box. The boxes have a subtle white border. Numbers shown: 9 0 2 9 1 0
- Resend line: "Don't receive the code. **Resend in 29s**" — grey + bold white
- CTA: Red pill button "Verify and continue" — centered, ~300px wide
- Caption: "Encrypted & Secure Verification" — tiny grey text below button

**Right edge of screen:** Subtle red ambient glow bleeding in from the right side for atmospheric depth.

---

## PAGE 5 — Role Selection Screen

**Context:** Post-registration role picker. User chooses their primary mode.

**Layout:** Full dark screen. Top: Azeebo logo left-aligned.

**Header Section:**
- Large bold white heading: "Select Your Azeebo+ Role"
- Subtitle: "Your curated home for Nigerian contents, community and creation." — smaller grey text

**Background:** Dark ambient — city aerial photo of Lagos at night subtly blurred behind content.

**3-Card Grid (horizontal row, equal width):**
Each card is a tall rounded dark rectangle with luminous white border glow:

**Card 1 — Regular User**
- Title: "Regular User" — white, centered, bold
- Image: AI-generated illustration of Nigerian family watching streaming content on TV — warm, cozy
- Description: "Enjoy premium Nigerian contents" — bold white
- Sub-desc: "Discover music, movie, creator and entertainment" — small grey
- CTA: Red pill "Select" button, full card width

**Card 2 — Creator**
- Title: "Creator" — white, centered, bold
- Image: AI-generated illustration of Nigerian female creator at camera rig with analytics/charts overlay
- Description: "Build your audience and brand"
- Sub-desc: "Showcase your talent, reach millions and connect"
- CTA: Red pill "Select"

**Card 3 — Creator & User**
- Title: "Creator & User" — white, centered, bold
- Image: AI-generated illustration of Nigerian professional man at MacBook with dashboard analytics
- Description: "Experience the best of both worlds"
- Sub-desc: "Consume content and create your journey"
- CTA: Red pill "Select"

**Cards have red bottom glow on the active/hovered state.**

---

## PAGE 6 — Profile Setup Screen

**Context:** Onboarding step — filling out profile details.

**Layout:** Full dark screen, no photo background. Two-column layout inside a card-like zone:

**Header (top-left):**
- "Profile Setup" — large bold white
- "Your curated home for Nigerian contents, community and creation." — small grey subtitle

**Left Column (~30% width):** Profile preview card — dark rounded card with:
- Large circular profile photo (woman in traditional Yoruba-inspired attire, gold jewelry, headwrap)
- Red overlay CTA tag on photo: "Change profile picture" — small red pill badge
- Name below photo: "Yetunde Williams" — bold white
- Username below: "@YetyWilly" — grey/muted

**Right Column (~70% width):** Form grid, 2 columns of inputs:
- Full name / Username
- Display Name / Email
- Phone Number / Location
- Date of Birth / Bio (textarea, taller)
- Gender (below Date of Birth)
- CTA: Red pill button "Continue to Interests" — left-aligned below the grid

**Input styling:** Rounded rectangle fields, dark fill, white text, subtle red border on focus. Labels are small, grey, all-caps above each field.

---

## PAGE 7 — Password Recovery Screen

**Context:** Forgot password — first step, enter email to receive reset link.

**Layout:** Full dark/black background. Left half has a dramatic 3D AI-rendered glowing padlock illustration — circuit-board texture, orange/gold keyhole glow, electric red energy arcing around the lock body.

**Left Section (~55%):**
- Glowing 3D padlock visual takes up most of vertical space
- Bottom-left text overlay: "Password Recovery" — large bold white, two lines

**Right Section (~45%):** Frosted glass card with glow border:
- Shield/lock icon at top center — white, on dark — inside a shield badge shape
- Body text: "Enter your email and we will send you a link to reset your password" — white, centered, medium size
- Input: "Registered Email / Username" label → field with placeholder "e.g. williams@azeebo.com"
- CTA: Full-width red pill "Send Recovery Link"
- Footer links: "Back to login. Need Support?" — small grey, centered

**Ambient red glow from bottom-right of screen for depth.**

---

## PAGE 8 — Password Reset Screen

**Context:** Authenticated reset — user enters current + new password.

**Layout:** Same 60/40 split. 

**Left Panel (60%):** Moody dark studio photo — two young Nigerian men collaborating at a computer, bookshelves in background, low warm lighting, dramatic side-fill. Bold white text bottom-left:
> "Password  
> Reset"

**Right Panel (40%):** Frosted glass dark card with white glow border:
- Title: "Reset your password" — white bold
- Subtitle: "Enter a strong new password to secure your account" — small grey
- Input: "Current password" → field with padlock icon left, dots
- Input: "New password" → same style
- **Password Strength Bar:** Four segmented bars below new password field, labeled Weak / Fair / Good / Strong. Each fills with a corresponding color: red → yellow → light green → bright green. All four showing in the mockup (strong state).
- Input: "Confirm password" → same field style
- CTA: Full-width red pill "Send Recovery Link"
- Footer: "Cancel" text link, centered, grey

---

## VISUAL NOTES (Applicable Across All Screens)

**Glass Card Treatment:**
All right-panel forms use the same frosted glass card system:
- Background: `rgba(15, 5, 5, 0.85)` dark with subtle red tint
- Border: 1px `rgba(255,255,255,0.2)` with outer glow
- Border radius: ~16px
- Box shadow: `0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(200,20,20,0.1)`

**Input Fields:**
- Dark fill (`#1E1E1E`)
- 1px border, slightly lighter than background
- Active/focus: red-left-border or full red border
- Padlock icon prefix on password fields
- White text, placeholder in muted grey

**CTA Button:**
- `background: #CC1C1C`
- `border-radius: 999px` (full pill)
- White bold text
- Subtle glow on hover: `box-shadow: 0 4px 20px rgba(204,28,28,0.5)`

**Typography Scale:**
- Page headline (marketing): 48–60px, ExtraBold
- Card title: 24–28px, Bold
- Label: 11–12px, All Caps, letter-spacing 0.08em
- Body/helper: 14px, Regular
- Footer/link: 13px, Regular with Bold inline emphasis

**Logo Placement:** Always top-left, above the fold, on all screens. White wordmark with orange "+" star on dark backgrounds; orange wordmark on green background.