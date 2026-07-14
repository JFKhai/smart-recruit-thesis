const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ message: 'Mật khẩu cần ít nhất 6 ký tự' });
        }
        const allowedRoles = ['candidate', 'employer', 'admin'];
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ (candidate hoặc employer)' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            password: hashedPassword,
            role
        });

        if (role === 'employer') {
            const CompanyProfile = require('../models/CompanyProfile');
            await CompanyProfile.create({
                userId: user._id,
                companyName: req.body.companyName || '',
                industry: req.body.industry || 'other',
                size: req.body.size || 'startup',
                country: req.body.country || 'Việt Nam',
                province: req.body.province || '',
                address: req.body.address || '',
                about: req.body.about || '',
                contactName: req.body.contactName || '',
                phone: req.body.phone || '',
                taxId: req.body.taxId || ''
            });
        }

        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors || {}).map((e) => e.message);
            return res.status(400).json({ message: msgs.join(' ') || error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }
        res.status(500).json({ message: error.message });
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    res.json({
        _id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isEmailSubscribed: req.user.isEmailSubscribed,
        status: req.user.status
    });
};


const googleAuth = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Redirecting to mock callback.");
        const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback?code=mock_google_code`;
        return res.redirect(callbackUrl);
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=profile%20email`;
    res.redirect(googleAuthUrl);
};


const googleCallback = async (req, res) => {
    const { code } = req.query;
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    
    try {
        let email, name, googleId;
        
        if (code === 'mock_google_code') {
            email = 'candidate_google@demo.com';
            name = 'Demo Google Candidate';
            googleId = 'mock_google_id_123456';
        } else {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
            
            const axios = require('axios');
            
            const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            });
            
            const { access_token } = tokenRes.data;
            
            const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            
            email = profileRes.data.email;
            name = profileRes.data.name || profileRes.data.given_name || 'Ứng viên Google';
            googleId = profileRes.data.sub;
        }
        
        if (!email) {
            return res.redirect(`${clientOrigin}/login?error=email_required`);
        }
        
        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        
        if (!user) {
            user = await User.create({
                email,
                googleId,
                role: 'candidate'
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        
        const CvProfile = require('../models/CvProfile');
        let cv = await CvProfile.findOne({ userId: user._id }).sort({ createdAt: -1 });
        if (!cv) {
            await CvProfile.create({
                userId: user._id,
                fullName: name,
                email: user.email,
                summary: "Hồ sơ được tạo tự động từ liên kết Google.",
                skills: [],
                embedding: [],
                isLookingForJob: true
            });
        }
        
        const token = generateToken(user._id);
        
        res.redirect(`${clientOrigin}/login?token=${token}&id=${user._id}&email=${user.email}&role=${user.role}`);
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.redirect(`${clientOrigin}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
};

const facebookAuth = (req, res) => {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
        console.warn("FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is missing. Redirecting to mock callback.");
        const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback?code=mock_facebook_code`;
        return res.redirect(callbackUrl);
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
    const facebookAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
};

const facebookCallback = async (req, res) => {
    const { code } = req.query;
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    
    try {
        let email, name, facebookId;
        
        if (code === 'mock_facebook_code') {
            email = 'candidate_facebook@demo.com';
            name = 'Demo Facebook Candidate';
            facebookId = 'mock_facebook_id_123456';
        } else {
            const appId = process.env.FACEBOOK_APP_ID;
            const appSecret = process.env.FACEBOOK_APP_SECRET;
            const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
            
            const axios = require('axios');
            
            const tokenRes = await axios.get(`https://graph.facebook.com/v12.0/oauth/access_token`, {
                params: {
                    client_id: appId,
                    client_secret: appSecret,
                    redirect_uri: redirectUri,
                    code
                }
            });
            
            const { access_token } = tokenRes.data;
            
            const profileRes = await axios.get(`https://graph.facebook.com/me`, {
                params: {
                    fields: 'id,name,email',
                    access_token
                }
            });
            
            email = profileRes.data.email;
            name = profileRes.data.name || 'Ứng viên Facebook';
            facebookId = profileRes.data.id;
        }
        
        if (!email) {
            email = `fb_${facebookId}@facebook.com`;
        }
        
        let user = await User.findOne({ $or: [{ facebookId }, { email }] });
        
        if (!user) {
            user = await User.create({
                email,
                facebookId,
                role: 'candidate'
            });
        } else if (!user.facebookId) {
            user.facebookId = facebookId;
            await user.save();
        }
        
        const CvProfile = require('../models/CvProfile');
        let cv = await CvProfile.findOne({ userId: user._id }).sort({ createdAt: -1 });
        if (!cv) {
            await CvProfile.create({
                userId: user._id,
                fullName: name,
                email: user.email,
                summary: "Hồ sơ được tạo tự động từ liên kết Facebook.",
                skills: [],
                embedding: [],
                isLookingForJob: true
            });
        }
        
        const token = generateToken(user._id);
        
        res.redirect(`${clientOrigin}/login?token=${token}&id=${user._id}&email=${user.email}&role=${user.role}`);
    } catch (error) {
        console.error('Facebook Auth Error:', error.message);
        res.redirect(`${clientOrigin}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    googleAuth,
    googleCallback,
    facebookAuth,
    facebookCallback
};