import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

export default function configurePassport() {
  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      // Calculate token expiry (default to 1 hour from now if not provided)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      if (!user) {
        // New user signup flow
        if (!req.query.state || req.query.state !== 'signup') {
          // If not in signup flow, redirect to signup page
          return done(null, false, { message: 'User not found. Please sign up first.' });
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profilePicture: profile.photos[0].value,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          googleTokenExpiry: expiryDate
        });
      } else {
        // Existing user login - update tokens
        await user.updateGoogleTokens(accessToken, refreshToken, expiryDate);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email'],
    passReqToCallback: true,
    enableProof: true,
    authType: 'rerequest',
    display: 'page'
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Facebook authentication received:', {
        accessToken,
        refreshToken,
        profile: {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photos: profile.photos?.[0]?.value
        },
        state: req.query.state
      });

      if (!profile.emails || !profile.emails[0]) {
        return done(new Error('No email found in Facebook profile'));
      }

      let user = await User.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      if (!user) {
        if (!req.query.state || req.query.state !== 'signup') {
          return done(null, false, { message: 'User not found. Please sign up first.' });
        }

        user = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profilePicture: profile.photos?.[0]?.value,
          facebookAccessToken: accessToken,
          facebookRefreshToken: refreshToken
        });
      } else {
        if (!user.facebookId) {
          user.facebookId = profile.id;
        }
        user.facebookAccessToken = accessToken;
        if (refreshToken) {
          user.facebookRefreshToken = refreshToken;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('Facebook auth error:', error);
      return done(error, null);
    }
  }));

  // Twitter Strategy
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "https://api.yourdomain.com/auth/twitter/callback",
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      console.log('Twitter profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        photos: profile.photos?.[0]?.value
      });

      let user = await User.findOne({ twitterId: profile.id });
      
      if (!user) {
        // Create new user with Twitter data
        user = await User.create({
          twitterId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          profilePicture: profile.photos?.[0]?.value,
          twitterAccessToken: token,
          twitterTokenSecret: tokenSecret
        });
      } else {
        // Update existing user
        user.twitterAccessToken = token;
        user.twitterTokenSecret = tokenSecret;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('Twitter auth error:', error);
      return done(error, null);
    }
  }));

  // LinkedIn Strategy
  passport.use(new LinkedInStrategy({
    clientID: '78rqsoywa4irt0',
    clientSecret: 'WPL_AP1.pfZTGK8LMgLcqXyr.ojVhJA==',
    callbackURL: "http://localhost:3000/auth/linkedin/callback",
    scope: ['r_liteprofile', 'w_member_social'],
    state: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('LinkedIn profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        photos: profile.photos?.[0]?.value
      });

      // Since we can't get email, we'll use LinkedIn ID for user lookup
      let user = await User.findOne({ linkedinId: profile.id });
      
      if (!user) {
        if (!req.query.state || req.query.state !== 'signup') {
          return done(null, false, { message: 'User not found. Please sign up first.' });
        }

        // Create new user with LinkedIn data
        user = await User.create({
          linkedinId: profile.id,
          name: profile.displayName,
          profilePicture: profile.photos?.[0]?.value,
          linkedinAccessToken: accessToken,
          linkedinRefreshToken: refreshToken
        });
      } else {
        // Update existing user
        user.linkedinAccessToken = accessToken;
        if (refreshToken) {
          user.linkedinRefreshToken = refreshToken;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}