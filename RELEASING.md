# Releasing Nimbus Cannabis OS CMS

This guide describes how to cut a new versioned release, update release notes, and tag the repository.

## Versioning

The project uses semantic versioning (SemVer):

- `MAJOR.MINOR.PATCH` (for example, `1.2.0`).
- Bump **MAJOR** when you make incompatible API changes.
- Bump **MINOR** when you add functionality in a backward-compatible manner.
- Bump **PATCH** for backward-compatible bug fixes.

## Release steps

1. Ensure the main branch is green:
   - `npm test`
   - `npm run build:admin`
   - `npm run build:api` (or equivalent build for the server)

2. Choose the new version number (e.g., `1.2.0`).

3. Update `docs/CMS_RELEASE_NOTES.md`:
   - Add a new section like:

```markdown
### v1.2.0 – Short description (YYYY-MM-DD)

- Bullet list of notable changes.
```

4. Commit changes:

```bash
git add docs/CMS_RELEASE_NOTES.md
git commit -m "chore(release): v1.2.0"
```

5. Tag the release:

```bash
git tag -a v1.2.0 -m "Nimbus Cannabis OS CMS v1.2.0"
```

6. Push commits and tags:

```bash
git push origin main
git push origin v1.2.0
```

7. (Optional) Build and publish Docker image:
   - Use your CI/CD pipeline or run `docker build`/`docker push` manually with the new tag.

## Notes

- Keep `CMS_RELEASE_NOTES.md` as the single source of truth for buyers.
- If you introduce breaking changes, call them out explicitly in the release notes.
