import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Helper function to process items in batches
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay between batches to prevent connection overload
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Sample data arrays
const specializations = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
  'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology', 
  'Orthopedics', 'Ophthalmology', 'ENT', 'Gynecology', 'Urology'
];

const qualifications = [
  'MBBS, MD', 'MBBS, MS', 'MBBS, DM', 'MBBS, MCh', 'MBBS, DNB',
  'MBBS, MD, Fellowship', 'MBBS, MS, Fellowship', 'BDS, MDS'
];

const hospitalNames = [
  'Apollo Hospital', 'Fortis Healthcare', 'Max Super Speciality Hospital',
  'AIIMS', 'Medanta - The Medicity', 'Kokilaben Dhirubhai Ambani Hospital',
  'Sir Ganga Ram Hospital', 'BLK Super Speciality Hospital', 'Artemis Hospital',
  'Columbia Asia Hospital', 'Narayana Health', 'Manipal Hospital',
  'Ruby Hall Clinic', 'Global Hospital', 'Jaslok Hospital', 'Lilavati Hospital',
  'Hinduja Hospital', 'KEM Hospital', 'Grant Medical College', 'Tata Memorial Hospital'
];

const departments = [
  'Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics',
  'Obstetrics & Gynecology', 'Cardiology', 'Neurology', 'Orthopedics',
  'Radiology', 'Pathology', 'Anesthesiology', 'Dermatology'
];

const facilities = [
  'ICU', 'NICU', 'Emergency Room', 'Operation Theater', 'Blood Bank',
  'Pharmacy', 'Laboratory', 'Imaging Center', 'Dialysis Unit', 'Physiotherapy'
];

const services = [
  'Consultation', 'Surgery', 'Diagnostic Tests', 'Health Checkups',
  'Emergency Care', 'Rehabilitation', 'Vaccination', 'Blood Tests'
];

const doctorNames = [
  { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@hospital.com' },
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@hospital.com' },
  { name: 'Dr. Amit Patel', email: 'amit.patel@hospital.com' },
  { name: 'Dr. Sunita Singh', email: 'sunita.singh@hospital.com' },
  { name: 'Dr. Vikram Gupta', email: 'vikram.gupta@hospital.com' },
  { name: 'Dr. Kavya Reddy', email: 'kavya.reddy@hospital.com' },
  { name: 'Dr. Arjun Mehta', email: 'arjun.mehta@hospital.com' },
  { name: 'Dr. Deepika Joshi', email: 'deepika.joshi@hospital.com' },
  { name: 'Dr. Rohit Agarwal', email: 'rohit.agarwal@hospital.com' },
  { name: 'Dr. Neha Kapoor', email: 'neha.kapoor@hospital.com' },
  { name: 'Dr. Sanjay Malhotra', email: 'sanjay.malhotra@hospital.com' },
  { name: 'Dr. Pooja Verma', email: 'pooja.verma@hospital.com' },
  { name: 'Dr. Kiran Desai', email: 'kiran.desai@hospital.com' },
  { name: 'Dr. Manoj Tiwari', email: 'manoj.tiwari@hospital.com' },
  { name: 'Dr. Rashmi Nair', email: 'rashmi.nair@hospital.com' },
  { name: 'Dr. Suresh Yadav', email: 'suresh.yadav@hospital.com' },
  { name: 'Dr. Anita Saxena', email: 'anita.saxena@hospital.com' },
  { name: 'Dr. Ravi Krishnan', email: 'ravi.krishnan@hospital.com' },
  { name: 'Dr. Meera Bansal', email: 'meera.bansal@hospital.com' },
  { name: 'Dr. Ashish Sinha', email: 'ashish.sinha@hospital.com' }
];

// Indian cities with coordinates
const locations = [
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777, address: 'Andheri West, Mumbai, Maharashtra' },
  { city: 'Delhi', lat: 28.7041, lng: 77.1025, address: 'Connaught Place, New Delhi' },
  { city: 'Bangalore', lat: 12.9716, lng: 77.5946, address: 'Koramangala, Bangalore, Karnataka' },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707, address: 'T. Nagar, Chennai, Tamil Nadu' },
  { city: 'Hyderabad', lat: 17.3850, lng: 78.4867, address: 'Banjara Hills, Hyderabad, Telangana' },
  { city: 'Pune', lat: 18.5204, lng: 73.8567, address: 'Koregaon Park, Pune, Maharashtra' },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639, address: 'Park Street, Kolkata, West Bengal' },
  { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, address: 'Navrangpura, Ahmedabad, Gujarat' },
  { city: 'Jaipur', lat: 26.9124, lng: 75.7873, address: 'Malviya Nagar, Jaipur, Rajasthan' },
  { city: 'Lucknow', lat: 26.8467, lng: 80.9462, address: 'Gomti Nagar, Lucknow, Uttar Pradesh' }
];

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createLocations() {
  console.log('Creating locations...');
  
  const results = await processBatch(
    locations,
    3, // Process 3 at a time
    async (loc) => {
      return prisma.location.create({
        data: {
          lat: loc.lat,
          lng: loc.lng,
          address: loc.address
        }
      });
    }
  );
  
  return results;
}

async function createHospitals(createdLocations: any[]) {
  console.log('Creating hospitals...');
  
  const hospitalData = hospitalNames.map((name, index) => ({
    name,
    departments: getRandomElements(departments, Math.floor(Math.random() * 6) + 4),
    facilities: getRandomElements(facilities, Math.floor(Math.random() * 5) + 3),
    services: getRandomElements(services, Math.floor(Math.random() * 4) + 3),
    hours: '24/7',
    locationId: createdLocations[index % createdLocations.length].id
  }));

  const results = await processBatch(
    hospitalData,
    5, // Process 5 at a time
    async (data) => {
      return prisma.hospital.create({ data });
    }
  );
  
  return results;
}

async function createDoctorsWithUsers(createdHospitals: any[]) {
  console.log('Creating doctors and users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const results = await processBatch(
    doctorNames,
    3, // Process 3 doctors at a time
    async (doctorData: { name: string; email: string }) => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: doctorData.email,
          password: hashedPassword,
          name: doctorData.name,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          role: Role.DOCTOR,
          verified: true
        }
      });

      // Create doctor profile
      const doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: getRandomElements(specializations, Math.floor(Math.random() * 3) + 1),
          qualifications: [getRandomElement(qualifications)],
          ratings: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
          about: `Experienced ${getRandomElement(specializations)} specialist with over ${Math.floor(Math.random() * 15) + 5} years of practice.`,
          price: getRandomPrice(500, 2000),
          noOfPatients: Math.floor(Math.random() * 500) + 50
        }
      });

      // Create doctor-hospital affiliation
      const randomHospital = getRandomElement(createdHospitals);
      await prisma.doctorHospital.create({
        data: {
          doctorId: doctor.id,
          hospitalId: randomHospital.id
        }
      });

      // Create availability (process sequentially to avoid connection issues)
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDays = getRandomElements(days, Math.floor(Math.random() * 4) + 3);
      
      for (const day of selectedDays) {
        await prisma.availability.create({
          data: {
            doctorId: doctor.id,
            day,
            startTime: '09:00',
            endTime: '17:00'
          }
        });
      }

      return { user, doctor };
    }
  );

  return results;
}

async function createLabsForHospitals(createdHospitals: any[], createdLocations: any[]) {
  console.log('Creating labs...');
  
  const labServices = [
    'Blood Tests', 'Urine Tests', 'X-Ray', 'CT Scan', 'MRI', 
    'Ultrasound', 'ECG', 'Echo', 'Pathology', 'Microbiology'
  ];

  const labData = createdHospitals.slice(0, 10).map((hospital, index) => ({
    hospitalId: hospital.id,
    name: `${hospital.name} Diagnostics`,
    services: getRandomElements(labServices, Math.floor(Math.random() * 5) + 3),
    locationId: createdLocations[index % createdLocations.length].id
  }));

  const results = await processBatch(
    labData,
    3, // Process 3 labs at a time
    async (data) => {
      return prisma.lab.create({ data });
    }
  );

  return results;
}

async function createMedicalTests(createdLabs: any[]) {
  console.log('Creating medical tests...');
  
  const tests = [
    { name: 'Complete Blood Count', category: 'Blood Test', price: 300, homeSample: true },
    { name: 'Lipid Profile', category: 'Blood Test', price: 800, homeSample: true },
    { name: 'Thyroid Function Test', category: 'Blood Test', price: 600, homeSample: true },
    { name: 'Chest X-Ray', category: 'Imaging', price: 400, homeSample: false },
    { name: 'ECG', category: 'Cardiac', price: 200, homeSample: false },
    { name: 'Urine Routine', category: 'Urine Test', price: 150, homeSample: true },
    { name: 'Blood Sugar', category: 'Blood Test', price: 100, homeSample: true },
    { name: 'Liver Function Test', category: 'Blood Test', price: 700, homeSample: true },
    { name: 'Kidney Function Test', category: 'Blood Test', price: 600, homeSample: true },
    { name: 'Vitamin D Test', category: 'Blood Test', price: 1200, homeSample: true }
  ];

  const testData = createdLabs.flatMap(lab =>
    getRandomElements(tests, Math.floor(Math.random() * 5) + 3).map(test => ({
      ...test,
      labId: lab.id
    }))
  );

  const results = await processBatch(
    testData,
    5, // Process 5 tests at a time
    async (data) => {
      return prisma.medicalTest.create({ data });
    }
  );

  return results;
}

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create locations
    const createdLocations = await createLocations();
    console.log(`✅ Created ${createdLocations.length} locations`);

    // Create hospitals
    const createdHospitals = await createHospitals(createdLocations);
    console.log(`✅ Created ${createdHospitals.length} hospitals`);

    // Create doctors with users
    const createdDoctors = await createDoctorsWithUsers(createdHospitals);
    console.log(`✅ Created ${createdDoctors.length} doctors with user accounts`);

    // Create labs
    const createdLabs = await createLabsForHospitals(createdHospitals, createdLocations);
    console.log(`✅ Created ${createdLabs.length} labs`);

    // Create medical tests
    const createdTests = await createMedicalTests(createdLabs);
    console.log(`✅ Created ${createdTests.length} medical tests`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSeeded data summary:');
    console.log(`- ${createdLocations.length} locations`);
    console.log(`- ${createdHospitals.length} hospitals`);
    console.log(`- ${createdDoctors.length} doctors`);
    console.log(`- ${createdLabs.length} labs`);
    console.log(`- ${createdTests.length} medical tests`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });