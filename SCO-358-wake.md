## Wake SCO-358
Payload: Blog — git push (allowlist)
Status: highest-priority wake for current heartbeat. No new comments.
Next actions:
- Validate push candidates against the allowlist using push-blog-only.mjs (dry-run if possible).
- Ensure the remote host matches github.com and repository path gestaoesportivabi-creator/free.git (already configured in .gitpush.allowlist.conf).
- If changes exist beyond allowlist, stop and inform; otherwise proceed to push.
- In CI, consider enforcing pre-push allowlist checks to prevent accidental pushes.

Note: The repository currently has a .gitpush.allowlist.conf defining host github.com and repo gestaoesportivabi-creator/free.git, and push-blog-only.mjs implements the required logic to enforce the allowlist before pushing blog content.
