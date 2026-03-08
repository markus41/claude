# Skills Hub

## Skill Index

- `az-cli.md`
- `graph-api.md`
- `pac-cli.md`
- `fabric-rest.md`
- `power-automate-rest.md`
- `firebase-extract.md`
- `stripe-integration.md`

## Usage Recipes

1. Select environment and tenant context.
2. Load credentials from Key Vault and verify token scopes.
3. Execute dry-run or read-only checks before mutation commands.
4. Persist outputs to control-plane artifacts for auditability.

## Troubleshooting

- Auth failures: refresh service principal secret or delegated token.
- Rate limiting: backoff with retry jitter and batch APIs where possible.
- Schema drift: run validation rules before applying ALM changes.
