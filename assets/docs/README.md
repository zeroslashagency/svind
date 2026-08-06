# assets/docs/

Client-supplied documents served for download: certificates, compliance
declarations, datasheets.

Empty on purpose. Every document below is referenced by a built page but has
not been supplied yet, so the links point at the `/downloads` page rather than
at a dead file.

| Expected file | Referenced by | Status |
|---|---|---|
| `iso-9001-certificate.pdf` | footer (all pages), credentials readouts | `[CLIENT TO CONFIRM]` — links point at `/downloads#iso-9001` |
| `is-807-3177-compliance-declaration.pdf` | `eot-cranes/double-girder.html` standards band | `[CLIENT TO CONFIRM]` — links point at `/downloads#is-807-compliance` |

When a document arrives, drop it here and repoint the link from
`/downloads#<anchor>` to `assets/docs/<file>`. Run `04_TEST/run.sh` afterwards:
the link check will confirm nothing else still points at the placeholder.
