require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const ServiceCategory = require('../models/ServiceCategory');
const VehicleType = require('../models/VehicleType');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const PlatformSettings = require('../models/PlatformSettings');

const categories = [
  'Basic Car Wash',
  'Premium Car Wash',
  'Interior Cleaning',
  'Exterior Cleaning',
  'Foam Wash',
  'Waterless Wash',
  'Deep Cleaning',
  'Ceramic Coating',
  'Car Polishing',
  'Bike Wash',
];

const vehicleTypes = ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Bike'];

const run = async () => {
  await connectDB();
  console.log('Clearing existing catalog + demo data...');

  // Only DEMO data is removed (users with @example.com / @splashpoint.com emails and what they own).
  // Real categories, vehicle types and real vendors/services are left untouched, so re-running is safe.
  const demoUsers = await User.find({ email: /@example\.com$|@splashpoint\.com$/ }).select('_id');
  const demoUserIds = demoUsers.map((u) => u._id);
  const demoVendorIds = await Vendor.find({ owner: { $in: demoUserIds } }).distinct('_id');
  await Promise.all([
    Service.deleteMany({ vendor: { $in: demoVendorIds } }),
    Vendor.deleteMany({ _id: { $in: demoVendorIds } }),
    Vehicle.deleteMany({ owner: { $in: demoUserIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  console.log('Seeding categories & vehicle types...');
  // Idempotent upserts keyed on slug / name: running the seed repeatedly never duplicates.
  const createdCategories = [];
  for (const [i, name] of categories.entries()) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    // eslint-disable-next-line no-await-in-loop
    const cat = await ServiceCategory.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, sortOrder: i } },
      { upsert: true, new: true }
    );
    createdCategories.push(cat);
  }
  const createdVehicleTypes = [];
  for (const [i, name] of vehicleTypes.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const vt = await VehicleType.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, sortOrder: i } },
      { upsert: true, new: true }
    );
    createdVehicleTypes.push(vt);
  }

  const findCat = (name) => createdCategories.find((c) => c.name === name)?._id;
  const findVeh = (name) => createdVehicleTypes.find((v) => v.name === name)?._id;

  console.log('Seeding approved demo vendors + profiles...');

  const vendorDataList = [
    {
      ownerName: 'Ravi Kumar',
      email: 'demo.vendor@example.com',
      phone: '9990001111',
      businessName: 'Shine Auto Care',
      address: 'Plot 12, Madhapur, Hyderabad',
      city: 'Hyderabad',
      pincode: '500081',
      location: { latitude: 17.4448, longitude: 78.3498 },
      coverImageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.8,
      ratingCount: 18,
      description: 'Top-rated in-shop car washing & detailing center in Madhapur with premium foam wash bays.',
    },
    {
      ownerName: 'Suresh Reddy',
      email: 'cleanride@example.com',
      phone: '9990002222',
      businessName: 'Clean Ride Auto Spa',
      address: 'Road No. 36, Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      pincode: '500033',
      location: { latitude: 17.4319, longitude: 78.4073 },
      coverImageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.9,
      ratingCount: 26,
      description: 'Luxury car detailing, ceramic coating, and deep interior steam cleaning station.',
    },
    {
      ownerName: 'Anil Varma',
      email: 'ecowash@example.com',
      phone: '9990003333',
      businessName: 'EcoWash Express',
      address: 'Financial District, Gachibowli, Hyderabad',
      city: 'Hyderabad',
      pincode: '500032',
      location: { latitude: 17.4401, longitude: 78.3489 },
      coverImageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.6,
      ratingCount: 14,
      description: 'Eco-friendly waterless and quick foam wash center right in the heart of Gachibowli IT hub.',
    },
    {
      ownerName: 'Vikram Singh',
      email: 'autoglow@example.com',
      phone: '9990004444',
      businessName: 'AutoGlow Car Studio',
      address: 'Cyber Towers Road, Hitec City, Hyderabad',
      city: 'Hyderabad',
      pincode: '500081',
      location: { latitude: 17.4504, longitude: 78.3808 },
      coverImageUrl: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.7,
      ratingCount: 20,
      description: 'Professional vehicle grooming, exterior wax polish, and underbody jet wash.',
    },
    {
      ownerName: 'Rahul Verma',
      email: 'royaltouch@example.com',
      phone: '9990005555',
      businessName: 'Royal Touch Detailing Hub',
      address: 'Main Road, Kondapur, Hyderabad',
      city: 'Hyderabad',
      pincode: '500084',
      location: { latitude: 17.4615, longitude: 78.3672 },
      coverImageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.5,
      ratingCount: 11,
      description: 'Complete automobile care facility offering deep cleaning, polishing, and bike wash.',
    },
    {
      ownerName: 'Kiran Patel',
      email: 'speedwash@example.com',
      phone: '9990006666',
      businessName: 'SpeedWash Auto Care',
      address: 'Road No. 12, Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      pincode: '500034',
      location: { latitude: 17.4156, longitude: 78.4347 },
      coverImageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
      ratingAverage: 4.9,
      ratingCount: 35,
      description: 'Express 20-minute foam wash & vacuuming specialists in Banjara Hills.',
    },
  ];

  const createdApprovedVendors = [];

  for (const vData of vendorDataList) {
    const owner = await User.create({
      name: vData.ownerName,
      email: vData.email,
      phone: vData.phone,
      password: 'password123',
      role: 'vendor',
    });

    const vendor = await Vendor.create({
      owner: owner._id,
      businessName: vData.businessName,
      ownerName: vData.ownerName,
      phone: vData.phone,
      email: vData.email,
      businessAddress: vData.address,
      city: vData.city,
      state: 'Telangana',
      pincode: vData.pincode,
      location: vData.location,
      coverImageUrl: vData.coverImageUrl,
      ratingAverage: vData.ratingAverage,
      ratingCount: vData.ratingCount,
      serviceAreas: ['Hyderabad', 'Secunderabad'],
      description: vData.description,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      workingHours: { start: '08:00', end: '20:00' },
    });

    owner.vendorProfile = vendor._id;
    await owner.save();
    createdApprovedVendors.push(vendor);
  }

  // Seed services for each approved vendor
  console.log('Seeding active services for vendors...');
  for (const v of createdApprovedVendors) {
    await Service.insertMany([
      {
        vendor: v._id,
        category: findCat('Basic Car Wash'),
        name: 'Basic Exterior Foam Wash',
        description: 'High-pressure exterior water rinse, foam wash, wheel cleaning, and microfiber dry.',
        basePrice: 299,
        vehiclePricing: [
          { vehicleType: findVeh('Hatchback'), price: 249 },
          { vehicleType: findVeh('Sedan'), price: 299 },
          { vehicleType: findVeh('SUV'), price: 399 },
          { vehicleType: findVeh('Luxury'), price: 599 },
        ],
        durationMinutes: 30,
        includedItems: ['Exterior foam wash', 'High pressure rinse', 'Tyre dressing', 'Wipe down'],
        approvalStatus: 'approved',
      },
      {
        vendor: v._id,
        category: findCat('Premium Car Wash'),
        name: 'Full Interior + Exterior Spa',
        description: 'Complete interior vacuuming, dashboard polish, glass cleaning, and exterior foam wash with liquid wax.',
        basePrice: 799,
        vehiclePricing: [
          { vehicleType: findVeh('Hatchback'), price: 699 },
          { vehicleType: findVeh('Sedan'), price: 799 },
          { vehicleType: findVeh('SUV'), price: 999 },
          { vehicleType: findVeh('Luxury'), price: 1499 },
        ],
        durationMinutes: 60,
        includedItems: ['Interior vacuum', 'Dashboard polish', 'Exterior wax foam wash', 'Tyre shine', 'Fragrance spray'],
        discountPercent: 10,
        approvalStatus: 'approved',
      },
      {
        vendor: v._id,
        category: findCat('Deep Cleaning'),
        name: 'Deep Interior Steam Cleaning',
        description: 'Sanitizing steam wash for upholstery, roof lining, carpet shampooing, and AC vent disinfection.',
        basePrice: 1299,
        durationMinutes: 90,
        includedItems: ['Seat shampooing', 'Steam sanitization', 'AC vent cleaning', 'Odor removal'],
        approvalStatus: 'approved',
      },
      {
        vendor: v._id,
        category: findCat('Bike Wash'),
        name: 'Bike Express Foam Wash',
        description: 'Foam wash, chain degreasing & lubrication for two-wheelers.',
        basePrice: 149,
        durationMinutes: 20,
        includedItems: ['Foam wash', 'Chain lube', 'Dry wipe'],
        approvalStatus: 'approved',
      },
    ]);
  }

  console.log('Seeding demo customer user...');
  const demoCustomer = await User.create({
    name: 'Demo Customer',
    email: 'demo.user@example.com',
    phone: '9998887777',
    password: 'password123',
    role: 'user',
  });

  console.log('Seeding demo customer vehicles...');
  await Vehicle.insertMany([
    {
      owner: demoCustomer._id,
      vehicleType: findVeh('SUV'),
      nickname: 'My Nexon',
      make: 'Tata',
      model: 'Nexon',
      registrationNumber: 'TS09AB1234',
      isDefault: true,
    },
    {
      owner: demoCustomer._id,
      vehicleType: findVeh('Hatchback'),
      nickname: 'City Runabout',
      make: 'Hyundai',
      model: 'i20',
      registrationNumber: 'TS10CD5678',
      isDefault: false,
    },
  ]);

  console.log('Seeding platform settings...');
  await PlatformSettings.findOneAndUpdate(
    { key: 'default' },
    { key: 'default', commissionPercent: 10, minLeadTimeHours: 2 },
    { upsert: true }
  );

  console.log('Seeding admin account...');
  await User.create({
    name: 'Platform Admin',
    email: 'admin@splashpoint.com',
    phone: '9000000000',
    password: 'password123',
    role: 'admin',
  });

  console.log('Seeding demo vendors in pending / rejected / suspended states...');
  const pendingOwner = await User.create({
    name: 'Priya Sharma',
    email: 'pending.vendor@example.com',
    phone: '9990007777',
    password: 'password123',
    role: 'vendor',
  });
  const pendingVendor = await Vendor.create({
    owner: pendingOwner._id,
    businessName: 'Sparkle Wash Co.',
    ownerName: 'Priya Sharma',
    phone: '9990007777',
    email: 'pending.vendor@example.com',
    businessAddress: 'Banjara Hills, Hyderabad',
    city: 'Hyderabad',
    location: { latitude: 17.416, longitude: 78.435 },
    description: 'Newly registered shop, awaiting admin review.',
    approvalStatus: 'pending',
  });
  pendingOwner.vendorProfile = pendingVendor._id;
  await pendingOwner.save();

  const rejectedOwner = await User.create({
    name: 'Arjun Mehta',
    email: 'rejected.vendor@example.com',
    phone: '9990008888',
    password: 'password123',
    role: 'vendor',
  });
  const rejectedVendor = await Vendor.create({
    owner: rejectedOwner._id,
    businessName: 'QuickShine Wash',
    ownerName: 'Arjun Mehta',
    phone: '9990008888',
    email: 'rejected.vendor@example.com',
    businessAddress: 'Gachibowli, Hyderabad',
    city: 'Hyderabad',
    approvalStatus: 'rejected',
    rejectionReason: 'Business details could not be verified. Please resubmit with updated contact information.',
    isActive: false,
  });
  rejectedOwner.vendorProfile = rejectedVendor._id;
  await rejectedOwner.save();

  console.log('\nSeed complete!');
  console.log('Demo customer login          -> demo.user@example.com | password123');
  console.log('Demo vendor login (approved) -> demo.vendor@example.com | password123');
  console.log('Demo vendor login (pending)  -> pending.vendor@example.com | password123');
  console.log('Demo vendor login (rejected) -> rejected.vendor@example.com | password123');
  console.log('Admin login                  -> admin@splashpoint.com | password123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

