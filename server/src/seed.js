/**
 * Comprehensive Database Seeder for Ali Cool Point App
 *
 * Seeds:
 *   1. Admin: admin@acp.com / admin123
 *   2. Technicians: ali@acp.com / tech123, rashid@acp.com / tech123
 *   3. Customers: customer@acp.com / customer123, meezan@acp.com / customer123
 *   4. Services (AC repair, Split, Cassette, HVAC, AMC, etc.)
 *   5. Products (Inverter ACs, Cassette, Floor Standing units)
 *   6. Bookings (Assigned to technician Ali, Pending for Admin review)
 *
 * Run: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Service = require('./models/Service');
const Product = require('./models/Product');
const Booking = require('./models/Booking');
const { connectDB } = require('./config/db');

const ADMIN = {
  name: 'ACP Admin',
  email: 'admin@acp.com',
  password: 'admin123',
  role: 'admin',
  phone: '+92 300 0000000',
  isActive: true,
};

const TECHNICIANS = [
  {
    name: 'Ali Technician',
    email: 'ali@acp.com',
    password: 'tech123',
    role: 'technician',
    phone: '+92 300 1234567',
    employeeId: 'TECH-001',
    status: 'active',
    completedJobs: 14,
    rating: 4.9,
    isActive: true,
  },
  {
    name: 'Rashid Khan',
    email: 'rashid@acp.com',
    password: 'tech123',
    role: 'technician',
    phone: '+92 312 9876543',
    employeeId: 'TECH-002',
    status: 'active',
    completedJobs: 9,
    rating: 4.8,
    isActive: true,
  },
];

const CUSTOMERS = [
  {
    name: 'Hassan Bhatti',
    email: 'customer@acp.com',
    password: 'customer123',
    role: 'customer',
    phone: '+92 321 4567890',
    address: 'Block 4, Clifton, Karachi',
    company: 'Zimplex IT Solutions',
    isActive: true,
  },
  {
    name: 'Meezan Bank Ltd',
    email: 'meezan@acp.com',
    password: 'customer123',
    role: 'customer',
    phone: '+92 300 7654321',
    address: 'Head Office, I.I. Chundrigar Rd, Karachi',
    company: 'Meezan Bank',
    isActive: true,
  },
];

const SERVICES = [
  { name: 'Split AC Service & Repair', subtitle: 'Cleaning, gas charging & fault repair', imageKey: 'split_ac', category: 'ac', requiresAcDetails: true, basePrice: 2500, sortOrder: 1 },
  { name: 'Cassette AC Service & Repair', subtitle: 'Deep cleaning & maintenance', imageKey: 'cassette_ac', category: 'ac', requiresAcDetails: true, basePrice: 3000, sortOrder: 2 },
  { name: 'Floor Standing AC Service', subtitle: 'Servicing & repair for floor units', imageKey: 'floor_ac', category: 'ac', requiresAcDetails: true, basePrice: 3200, sortOrder: 3 },
  { name: 'HVAC Installation & Ducting', subtitle: 'New installation and duct work', imageKey: 'hvac', category: 'hvac', requiresAcDetails: true, basePrice: 8000, sortOrder: 4 },
  { name: 'Annual Maintenance Contract (AMC)', subtitle: 'Scheduled visits all year round', imageKey: 'amc_icon', category: 'ac', requiresAcDetails: true, basePrice: 12000, sortOrder: 5 },
  { name: 'Preventive Maintenance Visit', subtitle: 'Health check to avoid breakdowns', imageKey: 'pm_icon', category: 'ac', requiresAcDetails: true, basePrice: 2000, sortOrder: 6 },
  { name: 'False Ceiling & Interior Works', subtitle: 'Ceiling, gypsum and light work', imageKey: 'false_ceiling', category: 'general', requiresAcDetails: false, basePrice: 0, sortOrder: 7 },
  { name: 'Electrical Works & Wiring', subtitle: 'Wiring, DB and safety checks', imageKey: 'electric_icon', category: 'general', requiresAcDetails: false, basePrice: 0, sortOrder: 8 },
  { name: 'Renovation & Fit-out', subtitle: 'Full room and office renovation', imageKey: 'reno_icon', category: 'general', requiresAcDetails: false, basePrice: 0, sortOrder: 9 },
];

const PRODUCTS = [
  {
    title: 'Gree 1.5 Ton Fairy Inverter',
    description: 'Energy-saving T3 Inverter with Wi-Fi control and rapid cooling technology.',
    category: 'Split',
    price: 185000,
    currency: 'PKR',
    imageKey: 'split_ac',
    inStock: true,
    isNewArrival: true,
    specs: { capacity: '1.5 Ton', inverter: 'Yes', warranty: '10 Years Compressor' },
  },
  {
    title: 'Dawlance Mega T3 Inverter 1.5 Ton',
    description: 'Engineered for extreme heat up to 60°C. 100% copper connecting pipes.',
    category: 'Split',
    price: 165000,
    currency: 'PKR',
    imageKey: 'split_ac',
    inStock: true,
    isNewArrival: true,
    specs: { capacity: '1.5 Ton', inverter: 'Yes', warranty: '12 Years Compressor' },
  },
  {
    title: 'Haier 2.0 Ton Commercial Cassette AC',
    description: '360-degree round air flow for uniform room cooling. Ideal for offices and restaurants.',
    category: 'Cassette',
    price: 320000,
    currency: 'PKR',
    imageKey: 'cassette_ac',
    inStock: true,
    isNewArrival: false,
    specs: { capacity: '2.0 Ton', inverter: 'Yes', warranty: '5 Years' },
  },
  {
    title: 'Orient 4.0 Ton Floor Standing Unit',
    description: 'Heavy-duty cooling for large halls, mosques and commercial halls.',
    category: 'Floor Standing',
    price: 450000,
    currency: 'PKR',
    imageKey: 'floor_ac',
    inStock: true,
    isNewArrival: false,
    specs: { capacity: '4.0 Ton', inverter: 'Yes', warranty: '5 Years' },
  },
];

async function seedUsers() {
  // Admin
  let adminUser = await User.findOne({ email: ADMIN.email });
  if (!adminUser) {
    adminUser = await User.create(ADMIN);
    console.log(`[seed] Admin created: ${ADMIN.email}`);
  } else {
    adminUser.password = ADMIN.password;
    adminUser.role = 'admin';
    await adminUser.save();
    console.log(`[seed] Admin verified: ${ADMIN.email}`);
  }

  // Technicians
  const seededTechs = [];
  for (const t of TECHNICIANS) {
    let tech = await User.findOne({ email: t.email });
    if (!tech) {
      tech = await User.create(t);
      console.log(`[seed] Technician created: ${t.email}`);
    } else {
      tech.password = t.password;
      tech.status = t.status;
      await tech.save();
      console.log(`[seed] Technician verified: ${t.email}`);
    }
    seededTechs.push(tech);
  }

  // Customers
  const seededCustomers = [];
  for (const c of CUSTOMERS) {
    let cust = await User.findOne({ email: c.email });
    if (!cust) {
      cust = await User.create(c);
      console.log(`[seed] Customer created: ${c.email}`);
    } else {
      cust.password = c.password;
      await cust.save();
      console.log(`[seed] Customer verified: ${c.email}`);
    }
    seededCustomers.push(cust);
  }

  return { adminUser, seededTechs, seededCustomers };
}

async function seedServicesCatalogue() {
  for (const s of SERVICES) {
    const exists = await Service.findOne({ name: s.name });
    if (!exists) {
      await Service.create({ ...s, isActive: true });
    }
  }
  console.log(`[seed] Services catalogue seeded (${SERVICES.length} total)`);
}

async function seedProductsCatalogue() {
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ title: p.title });
    if (!exists) {
      await Product.create(p);
    }
  }
  console.log(`[seed] Products catalogue seeded (${PRODUCTS.length} total)`);
}

async function seedSampleBookings(admin, techs, customers) {
  const service = await Service.findOne({ name: 'Split AC Service & Repair' });
  const techAli = techs[0]; // Ali Technician
  const customerHassan = customers[0]; // Hassan Bhatti
  const customerMeezan = customers[1]; // Meezan Bank

  const sampleBookings = [
    {
      bookingNo: 'ACP-2609-001',
      customer: customerHassan._id,
      service: service?._id,
      serviceName: 'Split AC Deep Cleaning & Chemical Wash',
      acType: 'Split',
      units: 2,
      problem: 'Cooling low, water leakage from indoor unit.',
      address: 'Block 4, Clifton, Karachi',
      scheduledDate: new Date(),
      timeSlot: '10:00-11:00',
      status: 'assigned',
      technicians: [techAli._id],
      price: 5000,
      adminNote: 'Customer wants morning service.',
      isPaid: false,
    },
    {
      bookingNo: 'ACP-2609-002',
      customer: customerMeezan._id,
      service: service?._id,
      serviceName: 'Gas Charging & Leakage Repair',
      acType: 'Cassette',
      units: 1,
      problem: 'Gas pipe leakage test and complete R410A refilling.',
      address: 'DHA Phase 6, Karachi',
      scheduledDate: new Date(),
      timeSlot: '14:00-15:00',
      status: 'assigned',
      technicians: [techAli._id],
      price: 8500,
      adminNote: 'Urgent office floor AC.',
      isPaid: false,
    },
    {
      bookingNo: 'ACP-2609-003',
      customer: customerHassan._id,
      service: service?._id,
      serviceName: 'Preventive Maintenance Health Check',
      acType: 'Split',
      units: 3,
      problem: 'General inspection before summer.',
      address: 'Block 4, Clifton, Karachi',
      scheduledDate: new Date(Date.now() + 86400000), // tomorrow
      timeSlot: '12:00-13:00',
      status: 'pending',
      technicians: [],
      price: 6000,
      adminNote: 'Pending admin technician assignment.',
      isPaid: false,
    },
  ];

  for (const b of sampleBookings) {
    const exists = await Booking.findOne({ bookingNo: b.bookingNo });
    if (!exists) {
      await Booking.create(b);
      console.log(`[seed] Booking created: ${b.bookingNo} (${b.status})`);
    }
  }
}

async function run() {
  try {
    await connectDB(process.env.MONGODB_URI, 3);
    const { adminUser, seededTechs, seededCustomers } = await seedUsers();
    await seedServicesCatalogue();
    await seedProductsCatalogue();
    await seedSampleBookings(adminUser, seededTechs, seededCustomers);
    console.log('✅ [seed] All collections seeded successfully!');
  } catch (err) {
    console.error('❌ [seed] Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
