# Bundled fonts and licenses

| Folder | Font | License |
| --- | --- | --- |
| `vazirmatn/` | Vazirmatn (Saber Rastikerdar) | SIL OFL 1.1 |
| `sahel/` | Sahel (Saber Rastikerdar) | SIL OFL 1.1 |
| `samim/` | Samim (Saber Rastikerdar) | SIL OFL 1.1 |
| `shabnam/` | Shabnam (Saber Rastikerdar) | SIL OFL 1.1 |
| `estedad/` | Estedad (Aydin Khosravi) | SIL OFL 1.1 |
| `dastkhat/`, `dastkhat_bar/`, `dastkhat_diamond/` | Dastkhat faces (project-owned) | Same license as this project's fonts, see note below |

> **Maintainer TODO:** confirm and state the license for the three Dastkhat faces
> (SIL OFL 1.1 is recommended) and add the license text next to them before publishing.

## Commercial fonts (not in the repository)

Aria, Dana, Farhang, Hamideh Saeian, IRANSansX, IRANYekanX, Morabba, Peyda, Ravi and
AzarMehr are commercial and **must not be redistributed**. They are `.gitignore`d, flagged
`proprietary: true` in `fonts.js`, and stripped from every store/release build by
`scripts/build.mjs`. To use them in your own local copy, set `DASTKHAT_FONT_SRC` to a folder
that contains them and run `npm run fonts`, then load the repo root as an unpacked extension.
