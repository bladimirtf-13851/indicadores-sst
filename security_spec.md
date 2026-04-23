# Security Specification - SST Expert

## Data Invariants
1. A user must have a role (`admin` or `company`).
2. A company record must belong to an existing company ID.
3. Users with `company` role can only access data belonging to their assigned `companyId`.
4. `admin` users have full override access.
5. `chargedDays` and `lostDays` must be non-negative.

## Dirty Dozen Payloads
1. Create a user with `admin` role as a non-admin.
2. Read a different company's records.
3. Update a record's `companyId` to steal data.
4. Delete another company's configuration.
5. Create a record with a negative value for `lostDays`.
6. Write to the `users` collection as a standard user to elevate privileges.
7. List all companies as a standard company user.
8. Update a company's NIT as a non-admin.
9. Injection of large strings in `description` to cause cost spikes.
10. Spoofing `request.auth.uid`.
11. Bypassing state logic (e.g. creating a record for a non-existent company).
12. Read `monthlyConfig` of another company.

## Rule Guardrail Strategy
- `isAdmin()` helper check.
- `isOwner(companyId)` helper for company users.
- `isValid[Entity]` for data integrity.
- Default deny all.
