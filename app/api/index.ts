"use server"
import { createSession, github, lucia } from "@/auth";
import { db } from "@/db/client";
import { OAuthAccount, User } from "@/db/schema";
import Headers from "@mjackson/headers";
import { OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { createRouter, defineEventHandler, getRequestURL, parseCookies } from "vinxi/http";

const router = createRouter();
router.get(
  "/",
  defineEventHandler((event) => {
    return { message: "Tadaa!" };
  }),
);

interface GitHubUser {
  id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  login: string;
}

router.get(
  "/login/github/callback",
  defineEventHandler(async (event) => {
    'use server'
    console.log("########## GitHub OAuth callback ##########");
    const url = getRequestURL(event);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookies = parseCookies(event) 
    const storedState = cookies["github_oauth_state"] ?? null;
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
    console.log(`GitHub user: ${JSON.stringify(githubUserProfile)}`);
    // console.log(`GitHub user: ${JSON.stringify(githubUserProfile)}`);
    //  email can be null if user has made it private.
    //  TODO get emails https://api.github.com/user/emails
    // TODO how do we verify the email
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
    // If no existing account check if the a user with the email exists and link the account.
    const newUser = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(User)
        .values({
          email: githubUserProfile.email,
          name: githubUserProfile.name || githubUserProfile.login,
          image: githubUserProfile.avatar_url,
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
  }),
)

export default router.handler;