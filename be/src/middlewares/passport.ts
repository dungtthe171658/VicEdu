import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import User from "../models/user.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Nên để URL đầy đủ để khớp Google Console (http/https + domain + port)
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    // Thêm kiểu cho tham số
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails?.[0]?.value }],
        });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.is_verified = true;
            await user.save();
          }
          return done(null, user as any);
        }

        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
          role: "user",
          is_verified: true,
          password: "google_oauth",
        });

        await user.save();
        return done(null, user as any);
      } catch (error) {
        return done(error as any, undefined as any);
      }
    }
  )
);

// Kiểu cho done
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, undefined);
  }
});

export default passport;
