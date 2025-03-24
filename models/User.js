import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        minlength: 2,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Please provide a valid email']
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 8
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);