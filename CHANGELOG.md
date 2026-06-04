# Changelog

## Final Demo Release - 2026-06-04

### Added
- Realistic ATK inventory seed data with telecommunications unit structure.
- Manage Unit edit feature for SuperAdmin.
- Manage Unit password reset feature for SuperAdmin.
- User dashboard improvements (frequent requests layout).
- Request calendar.
- Stock opname flow.
- Audit trail export.
- i18n English/Indonesian language support improvements.
- Integrity verification script.

### Changed
- Reworked inbound/outbound history pagination.
- Improved `HistoryKeluar` server-side pagination.
- Improved `BarangMasukCreate` to use master item dropdown.
- Improved frontend error feedback using toast/error state.
- Improved sidebar collapse animation.
- Improved dashboard visual polish.
- Improved mock user/unit names to real operational divisions.
- Improved localization keys across dashboard, requests, audit, calendar, stock opname, items, information, and history pages.

### Fixed
- Fixed pending request lock check using `atk_item_id` with legacy fallback.
- Fixed qty validation bug on `POST /api/requests`.
- Fixed raw translation keys such as `dashboard.totalRequests` and `dashboard.pendingValidation`.
- Fixed silent API failures on approval flows.
- Fixed HistoryKeluar fetching all data client-side.
- Fixed seed foreign key errors and orphan data issues.
- Fixed Manage Unit role guard for edit/reset password.
- Fixed username validation and duplicate handling.

### Security
- Added password hashing for reset unit password.
- Prevented password/hash exposure in API responses and audit logs.
- Strengthened SuperAdmin-only access on unit management.
- Added validation for username format.
- Added validation for request quantity before database insert.

### Testing
- Backend tests passed: 162/162.
- Integrity checks passed:
  - no negative stock,
  - no orphan request user,
  - no orphan request item,
  - no duplicate item code,
  - approved requests have barang_keluar,
  - valid status values.
- Controlled torture tests performed:
  - role bypass tests,
  - request edge cases,
  - approval race condition,
  - qty validation cases,
  - pagination edge cases,
  - light performance tests.

### Known Limitations
- JWT still uses localStorage; HttpOnly Cookie is recommended for future production hardening.
- Token/session invalidation after password reset is not fully implemented.
- Migration down() for `20260510_002_add_indexes_drop_unused.js` needs future cleanup because rollback failed when dropping FK-dependent index.
- Some database content such as announcement text and item names are not localized because they are stored data.
- Soft delete is not fully implemented.
