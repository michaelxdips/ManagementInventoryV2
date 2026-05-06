# Legacy Bootstrap Scripts

**⚠️ DEPRECATED — DO NOT USE FOR NEW DEPLOYMENTS**

This directory contains legacy database bootstrap scripts that were used before the Knex migration system was standardized.

## Why These Are Deprecated

Starting from **Phase 2 schema stabilization (May 2026)**, all database schema changes are managed through **Knex migrations** in `backend/src/migrations/`.

These legacy scripts are kept for historical reference only.

## Migration Path

If you need to set up a fresh database, use:

```bash
cd backend
npm run migrate        # Run all Knex migrations
npm run seed:data      # Seed initial data (optional)
```

## Legacy Scripts in This Directory

| File | Original Purpose | Replaced By |
|------|------------------|-------------|
| `update-db.js` | Create `stock_opname`, `stock_opname_items`, `audit_logs`, add `min_stock` column | `20260506_001_feature_runtime_tables.js` and `20260228_001_add_min_stock.js` |
| `setup-table.js` | Create `announcements` table | `20260506_001_feature_runtime_tables.js` |
| `migrate_add_units.js` | Add default user accounts (Lgs, bs, pai) | Should be in seed data, not migration |
| `migrate_approval_review.js` | Add `APPROVAL_REVIEW` status to requests enum | Already in initial schema `20260227_001_initial_schema.js` |
| `migrateAuditActionEnum.js` | Update `audit_logs.action` enum | Enum values already in `20260506_001_feature_runtime_tables.js` |

## If You Must Run These (Not Recommended)

These scripts use raw SQL and `process.exit()`, which bypasses Knex migration tracking.

Running them may cause:
- Migration state inconsistency
- Duplicate table creation errors
- Schema drift between environments

**Only run if you understand the risks and are working with a legacy database that predates the Knex migration system.**

## Questions?

See the main migration documentation in `backend/src/migrations/README.md` (if exists) or consult the Phase 2 audit report.
