# Event directory artwork

## Dance redesign — current website artwork

`dance-poster-v2.png` replaces the original poster in the landing and event cards. Generated with the built-in imagegen tool using both existing event atlases as style references: a single photographic solo dancer, dark stage, desaturated tones and restrained orange light. Text and prizes remain HTML, matching the other event cards. The original `dance-poster.png` is retained as an earlier version.

Final redesign prompt:

```text
Use case: style-transfer / website event artwork. Create ONE standalone square 1024x1024 photographic Dance competition image matching the supplied CrossFire event photography references. References are STYLE REFERENCES ONLY: reference 1 is the event directory photo atlas; reference 2 is the homepage photo atlas. Do not reproduce the grid. Single cinematic editorial photograph of a young adult Indian woman performing solo contemporary dance on an indoor college stage, modest black flowing performance outfit with trousers, dynamic graceful pose with one arm raised and the other extended, natural expressive face, full body visible, anatomically correct hands, convincing grounded footwork. Dark black stage, subtle cool cyan undertones, dramatic soft white rim lights, faint blurred audience and stage-light bokeh; a tiny restrained warm orange stage-light accent. Mostly desaturated near-black-and-white treatment, natural subtle skin color. Match the realism, rich shadows and restrained look of the runway cell in reference 2. Subject centered with dark breathing room around all sides, head at roughly 25 percent from top, expressive upper body in central 50 percent so a wide website card crop remains useful. Clean photographic asset, absolutely NO text, no typography, no prizes, no logos, no frame, no collage, no neon outlines, no orange swirls, no sparks, no paint strokes. This replaces the elaborate text-heavy Dance poster with the same photography-led format used by the existing event cards.
```

## Dance poster — 12 November 2026

`dance-poster.png` is original 1024 × 1536 promotional artwork generated with the built-in imagegen tool. It is illustrative, not a photograph of an actual participant. The website crops the central dancer through SVG viewports and links to the full poster. Dance is solo, Group A; performance time and judging criteria are unannounced.

Final prompt:

```text
Use case: ads-marketing. Create a polished portrait event poster for the existing CROSSFIRE 2026 Indian college talent festival. Dark near-black/navy and deep teal background, vivid restrained orange stage beams and warm gold sparks, premium bold condensed typography, energetic editorial dance photography. Central subject: a young adult Indian dancer in modest contemporary street-dance clothing performing a dynamic joyful move on stage, anatomically realistic limbs, tasteful motion trails, cinematic light. Do not imply a specific solo/team eligibility rule. Clear readable hierarchy and generous margins, no fake logos, no QR codes, no invented sponsors, no extra claims. Exact text: top 'CROSSFIRE 2026'; small 'SRUSTI ACADEMY OF GRADUATE STUDIES'; huge headline 'DANCE'; subheading 'OWN THE STAGE'; prominent '₹6,000 PRIZE POOL'; three distinct perfectly legible prize blocks '1ST • ₹3,000', '2ND • ₹2,000', '3RD • ₹1,000'; footer '15 NOVEMBER 2026' and 'SRUSTI CAMPUS, BHUBANESWAR'. Align prize blocks cleanly beneath the dancer. Original high quality promotional artwork, not a photo of an actual participant. No event time, group category, format, or registration URL.
```

Generated with the built-in imagegen tool for the approved event-page concept. Both files are original 1536 × 1024 PNGs. They are illustrative photography, not photos of the actual college, participants, or festival.

- [events-atlas.png](/C:/CrossFire/public/images/events-atlas.png): six equal photo cells, displayed through SVG viewports in `src/pages/EventsDiscoveryPage.tsx`. One shared image request supplies all cards.
- [events-campus.png](/C:/CrossFire/public/images/events-campus.png): atmospheric header background with CSS gradients keeping text readable.
- [Approved design reference](/C:/CrossFire/artifacts/frontend/event-design-concept.png).

## Final atlas prompt

```text
Create a premium editorial photographic contact sheet for an Indian college festival website CROSSFIRE. EXACTLY 3 columns by 2 rows, six equally sized square photographs edge to edge, no gutters, no borders, NO text, NO letters, NO watermarks, NO UI, NO logos. Landscape 1536x1024 image. Every photograph is realistic, elegant cinematic photography with dark outfits, warm natural skin, cool teal shadows and restrained orange details. Place primary faces/action near center, keep some width margin for cropping to wide banners.
Top left: two Indian college students, male with curly dark hair and female with glasses, dark casual tops, sitting at a quiz desk with a bright red buzzer, concentrated expressions, blue auditorium bokeh.
Top center: Indian young adult male in black shirt speaking passionately into a desk microphone in debate, clear expressive face and raised hand, auditorium background.
Top right: detailed close-up of a hand with a brush painting abstract orange and black forms on white art paper, paints and brushes blurred behind. No writing.
Bottom left: three Indian college-aged students with backpacks in light neutral tops exploring outdoor historic campus stone steps, holding a map or clue paper together, greenery, warm daylight.
Bottom center: adult Indian woman in elegant modest black eveningwear with subtle sequins, confident runway pose, medium shot, multicolored stage light bokeh.
Bottom right: hands holding a smartphone horizontally recording the crowd on an Indian college campus avenue, view of campus architecture and people through phone screen, warm evening sunlight. No readable text.
Photographs should match a cohesive high end cultural festival website, rich natural color, sharp but not oversharpened, authentic expressions, realistic hands and faces. Each of the six cells is a standalone shot.
```

## Final header prompt

```text
Create one wide cinematic photographic background for a premium Indian college competition website header. Landscape, approximately 1536x1024. Scene: a modern Indian college campus plaza at twilight with young adult students attending a cultural festival, realistic architecture and soft stage lights, electric cyan and teal accents, warm orange-lit windows. NOT an identifiable actual institution. An atmospheric crowd is concentrated in the right half of the composition with buildings receding in depth. Left half is very dark, soft empty negative space suitable for headline overlay. Keep the entire lower quarter dark. Subtle hazy light beams and scattered bokeh, realistic photographic grain, elegant editorial photography, not sci-fi. Restrained highlights so white website text will be readable. No text, no letters, no logos, no signs, no watermark, no UI.
```

