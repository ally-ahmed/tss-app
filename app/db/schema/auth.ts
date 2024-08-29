import { genId } from '@/lib/utils'
import { InferSelectModel, relations } from 'drizzle-orm'
import {
  index,
  int,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const User = sqliteTable('user', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => genId()),
  email: text('email', { length: 255 }).unique(),
  hashedPassword: text('hashed_password'),
  name: text('name', { length: 255 }),
  emailVerified: int('email_verified', {
    mode: 'boolean',
  }).default(false),
  image: text('image', { length: 255 }),
})

export const Session = sqliteTable(
  'session',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId()),
    userId: text('user_id', { length: 255 })
      .notNull()
      .references(() => User.id),
    expiresAt: int('expires_at', { mode: 'timestamp' }).notNull(),
    loginAt: int('login_at', { mode: 'timestamp' }).notNull(),
  },
  (session) => ({
    userIdIdx: index('session_user_id_idx').on(session.userId),
  }),
)

export const SessionRelations = relations(Session, ({ one }) => ({
  user: one(User, { fields: [Session.userId], references: [User.id] }),
}))

export const OAuthAccount = sqliteTable(
  'oauth_account',
  {
    userId: text('user_id', { length: 255 })
      .notNull()
      .references(() => User.id),
    provider: text('provider', {
      enum: ['github', 'google'],
      length: 255,
    }).notNull(),
    providerAccountId: text('provider_account_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index('oauth_account_user_id_idx').on(account.userId),
  }),
)

export const OAuthAccountsRelations = relations(OAuthAccount, ({ one }) => ({
  user: one(User, { fields: [OAuthAccount.userId], references: [User.id] }),
}))

export const SelectUserSchema = createSelectSchema(User).omit({
  hashedPassword: true,
})
export type UserType = z.infer<typeof SelectUserSchema>

export type SessionType = InferSelectModel<typeof Session>
