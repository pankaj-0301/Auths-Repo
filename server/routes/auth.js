import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Google Auth - Login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  state: 'login'
}));

// Google Auth - Signup
router.get('/google/signup', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  state: 'signup',
  prompt: 'consent',
  accessType: 'offline'
}));

// Google Auth Callback
router.get('/google/callback', passport.authenticate('google', { 
  session: false,
  failureRedirect: 'http://localhost:5173/register'
}), async (req, res) => {
  if (!req.user) {
    return res.redirect('/login?error=User not found. Please sign up first.');
  }
  
  // Get a valid access token
  const accessToken = await req.user.getValidGoogleAccessToken();
  
  const token = jwt.sign({ 
    id: req.user._id,
    googleAccessToken: accessToken,
    tokenExpiry: req.user.googleTokenExpiry
  }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
});

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Facebook Auth - Login
router.get('/facebook', (req, res, next) => {
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile'],
    state: 'login'
  })(req, res, next);
});

// Facebook Auth - Signup
router.get('/facebook/signup', (req, res, next) => {
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile'],
    state: 'signup'
  })(req, res, next);
});

// Facebook Auth Callback
router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { 
    failureRedirect: 'http://localhost:5173/login?error=auth_failed',
    session: false,
    display: 'page'
  })(req, res, next);
}, async (req, res) => {
  try {
    if (!req.user) {
      console.error('No user found in Facebook callback');
      return res.redirect('http://localhost:5173/login?error=authentication_failed');
    }

    console.log('Facebook callback success:', {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      state: req.query.state
    });

    const token = generateToken(req.user);
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
      facebookConnected: true
    };

    // Always redirect to profile page after successful authentication
    const redirectUrl = new URL('http://localhost:5173/profile');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify(userData));
    
    console.log('Redirecting to:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
});

// Twitter Auth - Login
router.get('/twitter', passport.authenticate('twitter'));

// Twitter Auth - Signup
router.get('/twitter/signup', passport.authenticate('twitter'));

// Twitter Auth Callback
router.get('/twitter/callback', 
  passport.authenticate('twitter', { 
    failureRedirect: 'http://localhost:5173/login?error=auth_failed',
    session: false
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('No user found in Twitter callback');
        return res.redirect('http://localhost:5173/login?error=authentication_failed');
      }

      const token = generateToken(req.user);
      const userData = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        twitterConnected: true
      };

      // Always redirect to profile page after successful authentication
      const redirectUrl = new URL('http://localhost:5173/profile');
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('user', JSON.stringify(userData));
      
      console.log('Redirecting to:', redirectUrl.toString());
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Twitter callback error:', error);
      res.redirect('http://localhost:5173/login?error=auth_failed');
    }
  }
);

// LinkedIn Auth - Login
router.get('/linkedin', (req, res, next) => {
  passport.authenticate('linkedin', { 
    scope: ['r_liteprofile', 'w_member_social'],
    state: 'login'
  })(req, res, next);
});

// LinkedIn Auth - Signup
router.get('/linkedin/signup', (req, res, next) => {
  passport.authenticate('linkedin', { 
    scope: ['r_liteprofile', 'w_member_social'],
    state: 'signup'
  })(req, res, next);
});

// LinkedIn Auth Callback
router.get('/linkedin/callback', (req, res, next) => {
  passport.authenticate('linkedin', { 
    failureRedirect: 'http://localhost:5173/login?error=auth_failed'
  })(req, res, next);
}, async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('http://localhost:5173/login?error=authentication_failed');
    }

    const token = generateToken(req.user);
    const userData = {
      id: req.user._id,
      name: req.user.name,
      profilePicture: req.user.profilePicture,
      linkedinConnected: true
    };

    const redirectUrl = new URL(
      req.query.state === 'signup' 
        ? 'http://localhost:5173/register' 
        : 'http://localhost:5173/profile'
    );
    
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userData)));
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
});

// Password Reset Request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Here you would typically send an email with the reset link
    // For demo purposes, we'll just return the token
    res.json({ message: 'Password reset email sent', resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Get user profile with token info
router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has Google connected, get valid token
    let googleAccessToken = null;
    if (user.googleId) {
      googleAccessToken = await user.getValidGoogleAccessToken();
    }

    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        googleConnected: !!user.googleId,
        googleAccessToken,
        tokenExpiry: user.googleTokenExpiry
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Auth Callback Handler
router.get('/auth-callback', (req, res) => {
  const token = req.query.token;
  if (token) {
    res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
  } else {
    res.redirect('http://localhost:5173/login?error=invalid_token');
  }
});

export default router;