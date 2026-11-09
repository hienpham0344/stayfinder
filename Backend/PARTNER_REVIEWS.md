# Partner review responses

Requires migration 011 (review visibility) and 013 (reply storage). These scripts are prepared, not applied.

- `GET /api/partner/accommodations/{id}/reviews?page=0&size=20`: owner-only review list, newest first; maximum page size 100.
- `PUT /api/partner/accommodations/{id}/reviews/{reviewId}/reply`: body `{"reply":"Thank you for your feedback"}`. Requires PARTNER and ownership. Saves one current response per review, with timestamp. The guest's rating and comment cannot be modified.
- `GET /api/accommodations/{id}/reviews/{reviewId}/partner-reply`: public current reply; `reply` is null if unanswered. Hidden reviews and inactive properties return 404.

The review is locked before the accommodation for a reply. Foreign review/property IDs cannot be used to respond on behalf of another partner. Reply revision history is outside this initial scope; only the current reply is stored.

Diagram mapping: UC-PARTNER-05. There is no dedicated ACT/SEQ for this use case in the reviewed diagram archive.
