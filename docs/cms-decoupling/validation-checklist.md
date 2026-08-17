# CMS Decoupling — Post-Cutover Validation Checklist

Run against **production** data (cms.okazakee.dev / okazakee.dev) once, after
the standalone CMS is deployed. Use a disposable `VALIDATION TEST` post and
delete it at the end. Expected results are from the behavior matrix
(`docs/cms-decoupling/behavior-matrix.md`).

## Session 1 — Core publishing loop

- [ ] Email login at `cms.okazakee.dev/en/login` → dashboard, correct identity + role
- [ ] Create blog post `VALIDATION TEST <timestamp>` (no image) → publish
- [ ] Post appears in the public blog list on `okazakee.dev` (first request may
      be stale — stale-while-revalidate is the accepted contract)
- [ ] Edit the post title → publish → public title updates
- [ ] Upload a **raw JPEG** image (do NOT let the browser pre-process; forces
      the server-side Sharp fallback path) → public post shows the image;
      storage object extension matches MIME (`.webp`/`image/webp` or
      `.png`/`image/png` — never a mismatch)
- [ ] Replace the image → old object removed from the `website` bucket
- [ ] Delete the post → gone from public, image object removed
- [ ] Author profile: change own display name → public post author name
      updates (exercises `author:<id>` invalidation) → revert
- [ ] Privacy policy: edit EN text → `/en/privacy-policy` reflects it
      (validates the fixed write path) → revert

## Session 2 — Parity spot checks

- [ ] EN resume upload from Contacts → resume link updates on the public site
      (`resume` + `hero_section` tags)
- [ ] IT resume upload from Contacts → same
- [ ] Avatar upload (self) → dashboard avatar updates
- [ ] Composite publish: blog + shared `posts-section` label change → public
      blog list labels update (`translations` tag)
- [ ] Hero section text change → homepage hero updates (`hero` tag)

## Storage checks (dashboard or SQL, after uploads)

- [ ] Blog/portfolio/avatar objects: filename extension matches `content_type`
- [ ] Replaced images: old objects gone, no orphans

## Rollback note

Any failure is localized — both apps share Supabase. The integrated CMS no
longer exists in the public repo (removed during Phase 13); the only rollback
lever is the Proxy redirect (`LEGACY_CMS_REDIRECT_HOST` unset), which routes
`/{locale}/cms*` to the public site's not-found instead of the CMS.
