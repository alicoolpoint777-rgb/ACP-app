require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const { connectDB } = require('./config/db');

async function clean() {
  try {
    await connectDB(process.env.MONGODB_URI, 3);
    
    // Delete all bookings
    const deletedBookings = await Booking.deleteMany({});
    console.log(`✅ Deleted Bookings: ${deletedBookings.deletedCount}`);
    
    // Delete all dummy customers and technicians
    const deletedUsers = await User.deleteMany({ role: { $in: ['customer', 'technician'] } });
    console.log(`✅ Deleted Dummy Customers & Technicians: ${deletedUsers.deletedCount}`);

    // Verify remaining users (Only Admin)
    const remaining = await User.find({});
    console.log('✅ Remaining Verified Accounts:', remaining.map(u => ({ email: u.email, role: u.role })));
  } catch (err) {
    console.error('❌ Clean error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

clean();
