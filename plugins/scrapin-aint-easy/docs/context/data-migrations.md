# Data Migrations

> How to evolve data safely.

## Migration Strategy

_How schema and data migrations are handled in this project._

## Patterns

- **Additive only**: Add columns, don't rename or remove
- **Backfill then switch**: Add new column → backfill → update code → drop old
- **Expand-contract**: Support both old and new simultaneously during transition

## Rollback

_How to roll back a failed migration._

## Tools

_What migration tooling is used (Prisma Migrate, Flyway, custom scripts, etc.)._
