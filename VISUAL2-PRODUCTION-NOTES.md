# CYBER CYPHER — Visual 2.0 production slice (5 November 2026)

Branch: `visual-2.0/approved-art-integration` from Alpha SHA `299e6901bf958c09c60242dc3e7ff1f0c6425af3`.

## Asset batches and approvals

- Batch A backgrounds: Sample #1 operations lobby, Sample #2 game environment, Sample #5 results chamber. New WebP paths in `public/assets/visual2/`.
- Batch B Zero Day: approved Sample #4 raster downsampled to 474×300 and kept as **new file**, original `public/assets/cards/zero.webp` untouched.
- Batch C portraits: Sample #3 approved **presentation style only**. Existing 24 native 256×256 agent images and identity keys unchanged; additive CSS framing avoids upscaling/replacing faces.

Sample #1 and #5 were originally 1672×941: they are not authentic 1920×1080 generated pictures. The 1920×1080 WebP production canvases use the **original 1672×941 pixels at native scale** centred over a blurred ambient extension. Do not claim newly rendered detail in those edge pixels.

The reference 5×5 board remains live HTML and its exact existing coordinate/grid rules are unchanged; art is an independent CSS background. Winner and scores remain live markup. The original VO, MP3s, cards and avatars remain unmodified.

`visual2-loader.js` enables the style only once all four files have loaded; otherwise the existing approved Alpha artwork remains in place. This is intentional because the branch's text changes may be committed before its binary files are present.

Do not merge or deploy without independent QA and owner approval.
