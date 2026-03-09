# Known Bugs & Workarounds (v1.25)

## 1. Schema Regex Validation Error

**Symptom:** Manifest validation rejects valid string values for certain properties.
**Root Cause:** v1.25 schema regex patterns are overly restrictive.
**Workaround:** Validate locally with `atk validate` before uploading to Dev Portal. If validation fails on valid values, the schema regex is the issue — safe to ignore that specific error.

## 2. Dev Portal Cannot Persist supportsChannelFeatures

**Symptom:** Setting `supportsChannelFeatures` in Dev Portal appears to save, but reloading shows the property is gone.
**Root Cause:** Dev Portal v1.25 write handler drops this property on save.
**Workaround:** Always edit `supportsChannelFeatures` in `manifest.json` directly. Do not use Dev Portal for this property.

```json
"supportsChannelFeatures": {
  "supportsSharedChannels": true,
  "supportsPrivateChannels": true
}
```

## 3. Dev Portal Cannot Upgrade to v1.25

**Symptom:** No UI option to change manifest version to 1.25 in Dev Portal.
**Root Cause:** Dev Portal UI doesn't support v1.25 upgrade path yet.
**Workaround:** Edit `manifestVersion` and `$schema` in JSON directly:

```json
"$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
"manifestVersion": "1.25"
```

## General Recommendation

For v1.25 development, treat `manifest.json` as the source of truth. Use CLI (`atk validate`) for validation. Only use Dev Portal for features it handles correctly (app registration, icon upload, basic metadata).
