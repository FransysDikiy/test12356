const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('./dotenv');

passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                let user;

                let linkUserId;

                try {
                    const state = JSON.parse(req.query.state);
                    linkUserId = state?.linkTo;
                } catch (e) {
                    linkUserId = undefined;
                }

                if (linkUserId) {
                    user = await User.findById(linkUserId);
                    if (!user) return done(null, false);

                    user.googleId = profile.id;
                    user.googleTokens = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    };

                    await user.save();
                    return done(null, user);
                }

                user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        user.googleId = profile.id;
                        user.googleTokens = {
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        };
                    } else {
                        user = new User({
                            username: profile.displayName,
                            email: profile.emails[0].value,
                            googleId: profile.id,
                            googleTokens: {
                                access_token: accessToken,
                                refresh_token: refreshToken,
                            },
                        });
                    }
                } else {
                    user.googleTokens = {
                        access_token: accessToken,
                        refresh_token: refreshToken || user.googleTokens?.refresh_token,
                    };
                }

                await user.save();
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
