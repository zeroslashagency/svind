# assets/img/

Images are filed by the **role they play in the DNA grammar**, not by size or by
subject. The role determines how an image may be used, so the folder is the
first check on whether it is being used correctly.

| Folder | Role | Rules |
|---|---|---|
| `cutouts/` | S2 background-free product cut-outs | Transparent PNG. Sits on a grey band with a drawn elliptical ground shadow. **Never upscaled past its native width** — `dna.css` caps the small one at its real 511px. Never boxed, never a backdrop |
| `bands/` | Wide band imagery, 2:1 and 3:2 | Placed **beside** copy, never behind it. `band-goliath-lifting-load.jpg` satisfies the §7 requirement that at least one band shows a crane lifting a real load in a real bay |
| `cards/` | §6 media-card shots, 4:3 | Bleeds to the card edge above the meta row. Zero radius, no border |
| `people/` | Portraits | Reserved for named individuals; consent is assumed only for the MD portrait supplied by the client |

Every file traces to one source frame in `../../../../assets/company/`. Nothing
is generated. Regenerate with `tools/make_assets.py` and `tools/make_cutouts.py`.
`make_assets.py` rejects an uncategorised destination outright via its `dest()`
guard; `make_cutouts.py` writes only into `cutouts/` because that is the single
directory it targets. Either way a new asset cannot land loose here, and the
test suite fails if one does.

## Produced but not yet placed

These exist because the pipeline makes them and they are good frames. They are
not referenced by any built page yet, which the test suite reports rather than
fails on.

| File | Intended for |
|---|---|
| `bands/band-fabrication-bay-eot.jpg` | A wide band on the unbuilt `/eot-cranes` category page |
| `cards/crated-dispatch-2.jpg` | Alternate dispatch frame; second choice to `crated-dispatch.jpg` |
| `cards/fabricated-chute-assembly.jpg` | A card on the unbuilt `/industries` pages |
| `people/md-umapathi-portrait.jpg` | The unbuilt `/about` page |

If one of these is still unplaced when its target page ships, delete it rather
than finding somewhere to put it.

## Dimensions

Declared `width`/`height` in the markup must match real pixels exactly —
`04_TEST/static/test_assets.py` checks every one against the file on disk, and
against `04_TEST/fixtures/asset_manifest.json`.
