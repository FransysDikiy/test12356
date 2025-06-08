const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validateMiddleware = require("../middlewares/validate");
const validationSchemas = require("../middlewares/schemas");
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authMiddleware = require("../middlewares/auth");
const saveLinkingUser = require("../middlewares/saveLinkingUser");

router.post(
    "/register",
    validateMiddleware(validationSchemas.registerUserSchema),
    authController.registerUser
);

router.post(
    "/login",
    validateMiddleware(validationSchemas.loginUserSchema),
    authController.login
);


router.post(
    "/google-login",
    validateMiddleware(validationSchemas.googleLoginSchema),
    authController.googleLogin
);


router.get(
    '/google',
    (req, res, next) => {
        const linkTo = req.query.linkTo;
        const state = linkTo ? JSON.stringify({ linkTo }) : undefined;

        passport.authenticate('google', {
            scope: [
                'profile',
                'email',
                'https://www.googleapis.com/auth/calendar.events',
            ],
            accessType: 'offline',
            prompt: 'consent',
            session: false,
            state,
        })(req, res, next);
    }
);


router.get(
    '/google/link',
    saveLinkingUser,
    passport.authenticate('google', {
        scope: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/calendar.events',
        ],
        accessType: 'offline',
        prompt: 'consent',
        session: false,
    })
);



router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }),
    (req, res) => {
        if (!req.user) {
            return res.redirect('http://localhost:3000/login');
        }

        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.redirect(`http://localhost:3000/token-handler?token=${token}`);
    }
);

router.post('/logout', authMiddleware(), validateMiddleware(validationSchemas.logoutSchema), authController.logoutUser);

module.exports = router;