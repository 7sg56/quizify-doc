import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
      const { name, email, password } = req.body;
      console.log('Received register request:', req.body); // Debugging

      // Check if all fields are provided
      if (!name || !email || !password) {
          return res.status(400).json({ 
              success: false, 
              error: 'All fields are required' 
          });
      }

      // Check if user exists
      let existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ 
              success: false, 
              error: 'User with this email already exists' 
          });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ 
          success: true, 
          message: 'User registered successfully' 
      });
  } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
          success: false, 
          error: 'Server error during registration' 
      });
  }
};



export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Create and assign token
        const token = jwt.sign(
            { _id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });

        res.json({ 
            success: true, 
            message: 'Logged in successfully' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during login' 
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error retrieving user' 
        });
    }
};