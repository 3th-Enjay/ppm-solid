# Phase 1 Security and Architecture Foundation

## Objective

This phase hardens the existing LMS so the next transformation work can proceed safely. The focus is on a secure server-side authentication and authorization foundation, not on redesigning the academy product.

## Authentication source of truth

The authoritative authentication flow is:

1. Browser sends credentials to a server route
2. Server validates credentials against the application database
3. Server issues a signed JWT
4. Server stores the session token in an HTTP-only cookie
5. Server reads the token from the request cookie or Authorization header for protected APIs
6. Server validates token signature and user existence before authorizing access

The client should not be treated as the source of authorization. Browser storage is not trusted for privileged identity claims.

## Current protections implemented in Phase 1

### JWT secret handling

- The application no longer silently falls back to a hard-coded production secret.
- The server intentionally fails closed when `JWT_SECRET` is missing in the runtime environment.
- This prevents accidental insecure deployments with a default secret.

### Auth token storage

- The persisted Zustand auth state does not keep the JWT in browser storage.
- This reduces the impact of client-side XSS on the browser session.
- The cookie remains the session boundary for the actual request authorization path.

### Course creation protection

The course creation API now requires:

- valid authenticated session
- role check for allowed creators
- server-derived ownership
- stripped request-controlled privileged fields
- approval fields cannot be forced by a normal instructor
- publication state cannot be trusted from the request body

The server now owns the resulting `instructorId`, `approved`, and `published` values.

## Central authorization model

The project now uses a small shared authorization utility layer in `lib/authorization.ts`.

It provides reusable logic for:

- reading the current user from a request
- checking roles
- checking owned-resource access
- sanitizing privileged course fields before persistence

This reduces scattered authorization logic and gives later phases a single place to extend permissions.

## Protected API boundary

Protected operations should be authorized server-side. In this phase, the key security boundaries addressed are:

- course create
- course update
- course delete
- user self-service updates
- admin-level user management
- payment verification and review routes
- token validation for protected page access

The important rule is: cookie existence alone is never sufficient authorization.

## Remaining risks

Some security concerns still belong to later phases and are explicitly not part of this phase:

- full RBAC matrix for every route
- end-to-end object ownership checks for every private resource
- a complete commerce/entitlement redesign
- payment-state refactor and full entitlement ledger
- audit logging expansion across all domains
- LDAP or enterprise identity integration
- rate limiting and CSRF hardening at the framework boundary

## Phase 2 guidance

Phase 2 should focus on expanding the centralized authorization model to all route groups, then layering in a future-proof entitlements and approval model without changing the core security system design.
