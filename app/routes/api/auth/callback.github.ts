import Headers from "@mjackson/headers";
import { createAPIFileRoute } from "@tanstack/start/api";

import { createSession, github, lucia } from "@/auth";
import { db } from "@/db/client";
import { OAuthAccount, User } from "@/db/schema";
import { OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";

interface GitHubUser {
  id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  login: string;
  verified: boolean;
}
export const Route = createAPIFileRoute('/api/auth/callback/github')({
  GET: async ({request, params}) => {
    console.log("########## GitHub OAuth callback ##########");
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const headers = new Headers(request.headers)
    const cookies = headers.cookie
    const storedState = cookies.get("github_oauth_state")?? null;
    if (!code || !state || !storedState || state !== storedState) {
      console.error(
        `Invalid state or code in GitHub OAuth callback: ${JSON.stringify({ code, state, storedState })}`,
      );
      console.error(`Cookies: ${JSON.stringify(cookies)}`);
      return new Response(null, {
        status: 400,
      });
    }

    try {
      const tokens = await github.validateAuthorizationCode(code);
      const userProfile = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const githubUserProfile = (await userProfile.json()) as GitHubUser;
      // console.log(`GitHub user: ${JSON.stringify(githubUserProfile)}`);
      //  email can be null if user has made it private.
      const existingAccount = await db.query.OAuthAccount.findFirst({
        where: (fields) =>
          and(
            eq(fields.provider, "github"),
            eq(fields.providerAccountId, githubUserProfile.id.toString()),
          ),
      });
      if (existingAccount) {
        const session = await createSession(existingAccount.userId);
        const sessionCookie = lucia.createSessionCookie(session.id, session.expiresAt);
        const headers = new Headers()
        headers.setCookie = sessionCookie.serialize() 
        headers.set('Location', '/')
        return new Response(null, {
          status: 302,
          headers
        });
      }
      if (!githubUserProfile.email) {
        const emailResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`
          }
        });
        const emails = await emailResponse.json();
        // [{"email":"email1@test.com","primary":true,"verified":true,"visibility":"public"},{"email":"email2@test.com","primary":false,"verified":true,"visibility":null}]
        const primaryEmail  = emails.find((email: { primary: boolean }) => email.primary);
        // TODO verify the email if not verified
        if (primaryEmail) {
          githubUserProfile.email = primaryEmail.email;
          githubUserProfile.verified = primaryEmail.verified;
        }else if (emails.length > 0) {
          githubUserProfile.email = emails[0].email;
          githubUserProfile.verified = emails[0].verified;
        }
      }
      // If no existing account check if the a user with the email exists and link the account.
      const newUser = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(User)
          .values({
            email: githubUserProfile.email,
            name: githubUserProfile.name || githubUserProfile.login,
            image: githubUserProfile.avatar_url,
            emailVerified: githubUserProfile.verified,
          })
          .returning({
            id: User.id,
          });
        if (!newUser) {
          return null;
        }
        await tx.insert(OAuthAccount).values({
          provider: "github",
          providerAccountId: githubUserProfile.id.toString(),
          userId: newUser?.id,
          accessToken: tokens.accessToken
        });
        return newUser;
      });
      if (!newUser) {
        console.error("Failed to create user account");
        return new Response(null, {
          status: 500,
        });
      }
      const session = await createSession(newUser.id);
      const sessionCookie = lucia.createSessionCookie(session.id, session.expiresAt);
      const headers = new Headers()
      headers.setCookie = sessionCookie.serialize() 
      headers.set('Location', '/')
      return new Response(null, {
        status: 302,
        headers
      });
    } catch (e) {
      console.log(e);
      if (e instanceof OAuth2RequestError) {
        // bad verification code, invalid credentials, etc
        return new Response(null, {
          status: 400,
        });
      }
      return new Response(null, {
        status: 500,
      });
    }
    // TODO: Handle error page
  }
})