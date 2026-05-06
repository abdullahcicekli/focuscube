export type ProviderName = "google" | "github"

export type ProfileFromProvider = {
  provider: ProviderName
  providerUserId: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export async function upsertUserFromProvider(
  db: D1Database,
  profile: ProfileFromProvider
): Promise<{ id: string }> {
  const existing = await db
    .prepare(
      `SELECT id FROM users WHERE provider = ? AND provider_user_id = ?`
    )
    .bind(profile.provider, profile.providerUserId)
    .first<{ id: string }>()

  if (existing) {
    await db
      .prepare(
        `UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?`
      )
      .bind(profile.email, profile.name, profile.avatarUrl, existing.id)
      .run()
    return existing
  }

  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO users (id, email, name, avatar_url, provider, provider_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      profile.email,
      profile.name,
      profile.avatarUrl,
      profile.provider,
      profile.providerUserId,
      Date.now()
    )
    .run()
  return { id }
}
