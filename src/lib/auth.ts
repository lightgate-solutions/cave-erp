import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { desc, eq } from "drizzle-orm";
import { member } from "@/db/schema";
import {
  admin,
  twoFactor,
  organization,
  createAuthMiddleware,
  username,
} from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import {
  sendDeleteAccountVerificationEmail,
  sendEmailVerificationEmail,
  sendOrganizationInviteEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./emails";
import { subscriptions } from "@/db/schema/subscriptions";
import { user as userSchema } from "@/db/schema/auth";

export const auth = betterAuth({
  appName: "Cave ERP",
  trustedOrigins: ["http://localhost:3000", "https://*.cave.ng"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
    },
  }),

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url, newEmail }) => {
        await sendEmailVerificationEmail({
          user: { ...user, email: newEmail },
          url,
        });
      },
    },
  },

  deleteUser: {
    enabled: true,
    sendDeleteAccountVerification: async ({
      user,
      url,
    }: {
      user: typeof schema.user.$inferSelect;
      url: string;
    }) => {
      await sendDeleteAccountVerificationEmail({ user, url });
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerificationEmail({ user, url });
    },
  },

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  plugins: [
    nextCookies(),
    username(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            ownerId: {
              type: "string",
              input: true,
              required: true,
            },
          },
        },
      },
      sendInvitationEmail: async ({
        email,
        organization,
        inviter,
        invitation,
      }) => {
        await sendOrganizationInviteEmail({
          invitation,
          inviter: inviter.user,
          organization,
          email,
        });
      },
    }),
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendOtpEmail({ user, otp });
        },
      },
      skipVerificationOnEnable: true,
    }),
    admin(),
  ],

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.includes("/sign-up") || ctx.path.includes("/signup")) {
        const user = ctx.context.newSession?.user ?? {
          name: ctx.body?.name,
          email: ctx.body?.email,
          id: ctx.body?.id,
          role: ctx.body?.role,
        };

        if (user != null && user.email) {
          try {
            await sendWelcomeEmail(user);
          } catch (error) {
            // Log error but don't fail sign-up if welcome email fails
            console.error(
              "Failed to send welcome email for user:",
              user.id,
              error,
            );
          }
        }
      }
    }),
  },

  databaseHooks: {
    session: {
      create: {
        before: async (userSession) => {
          const membership = await db.query.member.findFirst({
            where: eq(member.userId, userSession.userId),
            orderBy: desc(member.createdAt),
            columns: { organizationId: true },
          });

          return {
            data: {
              ...userSession,
              activeOrganizationId: membership?.organizationId,
            },
          };
        },
      },
    },

    user: {
      create: {
        after: async (user) => {
          // Initialize subscription with free plan
          try {
            await db.insert(subscriptions).values({
              id: `sub_${user.id}_${Date.now()}`,
              userId: user.id,
              plan: "free",
              status: "active",
              pricePerMember: "0.00",
              currentPeriodStart: new Date(),
              currentPeriodEnd: null,
              trialEnd: null,
            });

            await db
              .update(userSchema)
              .set({ role: "admin" })
              .where(eq(userSchema.id, user.id));
          } catch (error) {
            // Log error but don't fail user creation if subscription creation fails
            console.error(
              "Failed to create free subscription for user:",
              user.id,
              error,
            );
          }

          // Note: Employee record is created when user joins/creates an organization
          // Not during sign-up since organization context is required
        },
      },
    },
  },
});
