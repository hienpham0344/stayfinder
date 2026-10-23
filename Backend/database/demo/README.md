# Review-only USER demo seed

[001_catalog_seed.sql](001_catalog_seed.sql) is a proposed **data** batch. It has not been applied to any schema. Its LF-normalized SHA-256 is:

`7f09dd0adde57b00c1eb13c44f1504387118771ba38e19df2c8082de946037a0`

It adds four fictional locations, four property types, eight amenities, four stays, five bookable room tiers, four reuse-of-prototype cover URLs, seven comparison offers and four reward offers. Every price is explicit USD integer cents. Existing `base_price` / `room.price` values are untouched and never treated as USD. It creates no users, reviews, ratings, wallets, points, claims, bookings, payments, refunds or notifications. Offer names are fictional, all fees and free-cancellation terms match the direct tier, and `observed_at` is the actual seed execution time. Cover images refer to the prototype's existing external URLs and may be unavailable offline.

The SQL is all-or-nothing and deliberately fails on any fixed UUID/code conflict. The execution session must set `search_path` to the exact approved target, `stayfinder.target_schema` to the same schema, and `stayfinder.demo_seed_approved=true`. This setting is a guard, not authorization. Before any run, separately approve the exact schema and frozen file hash, verify migrations 001–009, inspect conflicts/row counts and current public metadata, and arrange a target-specific postflight. Do not use a wildcard runner, apply the script to an unreviewed schema, or silently insert into `public`.

Expected newly inserted rows: locations 4, accommodation_type 4, features 8, accommodations 4, accommodation_features 10, room 5, images 4, demo_price_comparisons 7, reward_offers 4 (50 total). A failed transaction rolls back. After commit, no automatic delete/reset is authorized: bookings or other user data may reference the seed IDs. Reversal needs a separate dependency-aware, exact-target review.

Static contract verification without a database:

```powershell
node --test Backend/database/demo/catalog_seed.test.mjs
```

This checks the approval guard, one-shot behavior, deterministic UUID/FK relationships, USD/fee/cancellation consistency and reward terms. It does **not** prove PostgreSQL constraints or runtime USER screens; those require an approved target and healthy DB.
