const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Image URLs
const DOCTOR_MALE_IMAGE = "https://static.vecteezy.com/system/resources/thumbnails/026/375/249/small_2x/ai-generative-portrait-of-confident-male-doctor-in-white-coat-and-stethoscope-standing-with-arms-crossed-and-looking-at-camera-photo.jpg";
const DOCTOR_FEMALE_IMAGE = "https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_1301-7807.jpg?semt=ais_hybrid&w=740&q=80";
const HOSPITAL_IMAGE = "https://media.gettyimages.com/id/1312706413/photo/modern-hospital-building.jpg?s=612x612&w=gi&k=20&c=1-EC4Mxf--5u4ItDIzrIOrduXlbKRnbx9xWWtiifrDo=";
const HOSPITAL_BANNER = "https://picsum.photos/1200/400";
const LAB_IMAGE = "https://media.gettyimages.com/id/1312706413/photo/modern-hospital-building.jpg?s=612x612&w=gi&k=20&c=1-EC4Mxf--5u4ItDIzrIOrduXlbKRnbx9xWWtiifrDo=";
const LAB_BANNER = "https://picsum.photos/1200/400";

// Sample data arrays
const hospitalNames = [
  "Apollo Hospital", "Fortis Healthcare", "Max Super Speciality Hospital", "Medanta - The Medicity",
  "AIIMS Delhi", "Lilavati Hospital", "Kokilaben Dhirubhai Ambani Hospital", "Manipal Hospital",
  "Narayana Health", "Columbia Asia Hospital", "Global Hospital", "Ruby Hall Clinic",
  "Wockhardt Hospital", "Breach Candy Hospital", "Jaslok Hospital", "P.D. Hinduja Hospital",
  "King Edward Memorial Hospital", "Sir Ganga Ram Hospital", "Safdarjung Hospital", "BLK Super Speciality Hospital"
];

const doctorNames = {
  male: [
    "Dr. Rajesh Kumar", "Dr. Amit Sharma", "Dr. Suresh Patel", "Dr. Vikram Singh", "Dr. Arjun Gupta",
    "Dr. Kiran Reddy", "Dr. Manoj Agarwal", "Dr. Deepak Joshi", "Dr. Ravi Mehta", "Dr. Sandeep Verma",
    "Dr. Ashish Tiwari", "Dr. Nitin Kulkarni", "Dr. Pradeep Nair", "Dr. Rohit Malhotra", "Dr. Sanjay Chopra",
    "Dr. Vijay Khanna", "Dr. Ankit Bansal", "Dr. Harish Yadav", "Dr. Gaurav Saxena", "Dr. Naveen Goel"
  ],
  female: [
    "Dr. Priya Sharma", "Dr. Sunita Gupta", "Dr. Kavita Patel", "Dr. Meera Singh", "Dr. Neha Agarwal",
    "Dr. Ritu Verma", "Dr. Anjali Reddy", "Dr. Pooja Joshi", "Dr. Sonia Mehta", "Dr. Rekha Nair",
    "Dr. Shweta Kulkarni", "Dr. Nisha Malhotra", "Dr. Preeti Chopra", "Dr. Swati Khanna", "Dr. Divya Bansal",
    "Dr. Archana Yadav", "Dr. Shreya Saxena", "Dr. Nikita Goel", "Dr. Arpita Das", "Dr. Manisha Roy"
  ]
};

const specializations = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology", "Dermatology",
  "Gastroenterology", "Pulmonology", "Urology", "Oncology", "Endocrinology", "Nephrology",
  "Rheumatology", "Psychiatry", "Ophthalmology", "ENT", "Radiology", "Anesthesiology"
];

const qualifications = [
  ["MBBS", "MD", "DM"], ["MBBS", "MS", "MCh"], ["MBBS", "MD", "FRCP"],
  ["MBBS", "MS", "FICS"], ["MBBS", "MD", "DNB"], ["MBBS", "MS", "MRCS"]
];

const departments = [
  "Emergency", "ICU", "Cardiology", "Neurology", "Orthopedics", "Pediatrics",
  "Gynecology", "Surgery", "Radiology", "Pathology", "Pharmacy", "Physiotherapy"
];

const facilities = [
  "24/7 Emergency", "ICU", "NICU", "Operation Theater", "Blood Bank", "Pharmacy",
  "Diagnostic Center", "Ambulance Service", "Parking", "Cafeteria", "WiFi", "AC Rooms"
];

const services = [
  "General Consultation", "Emergency Care", "Surgery", "Diagnostic Services",
  "Preventive Health Checkups", "Vaccination", "Home Care", "Telemedicine"
];

const labNames = [
  "PathLab Diagnostics", "SRL Diagnostics", "Dr. Lal PathLabs", "Metropolis Healthcare",
  "Thyrocare Technologies", "Quest Diagnostics", "Vijaya Diagnostic Centre", "Suburban Diagnostics",
  "Healthians", "1mg Labs"
];

const labServices = [
  "Blood Tests", "Urine Tests", "X-Ray", "Ultrasound", "ECG", "CT Scan", "MRI",
  "Pathology", "Microbiology", "Biochemistry", "Hematology", "Immunology"
];

const medicalTests = [
  { name: "Complete Blood Count (CBC)", category: "Hematology", price: 300, homeSample: true },
  { name: "Lipid Profile", category: "Biochemistry", price: 800, homeSample: true },
  { name: "Thyroid Profile", category: "Endocrinology", price: 600, homeSample: true },
  { name: "Liver Function Test", category: "Biochemistry", price: 500, homeSample: true },
  { name: "Kidney Function Test", category: "Biochemistry", price: 450, homeSample: true },
  { name: "HbA1c", category: "Diabetes", price: 400, homeSample: true },
  { name: "Vitamin D", category: "Vitamins", price: 1200, homeSample: true },
  { name: "X-Ray Chest", category: "Radiology", price: 300, homeSample: false },
  { name: "Ultrasound Abdomen", category: "Radiology", price: 800, homeSample: false },
  { name: "ECG", category: "Cardiology", price: 200, homeSample: false }
];

// Indian cities with realistic coordinates
const locations = [
  { city: "Mumbai", lat: 19.0760, lng: 72.8777, addresses: ["Andheri West", "Bandra", "Juhu", "Powai", "Lower Parel"] },
  { city: "Delhi", lat: 28.6139, lng: 77.2090, addresses: ["Connaught Place", "Karol Bagh", "Lajpat Nagar", "Saket", "Rohini"] },
  { city: "Bangalore", lat: 12.9716, lng: 77.5946, addresses: ["Koramangala", "Whitefield", "Indiranagar", "JP Nagar", "Electronic City"] },
  { city: "Chennai", lat: 13.0827, lng: 80.2707, addresses: ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Porur"] },
  { city: "Hyderabad", lat: 17.3850, lng: 78.4867, addresses: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitech City", "Kukatpally"] },
  { city: "Pune", lat: 18.5204, lng: 73.8567, addresses: ["Koregaon Park", "Baner", "Wakad", "Kothrud", "Pimpri"] },
  { city: "Kolkata", lat: 22.5726, lng: 88.3639, addresses: ["Park Street", "Salt Lake", "Ballygunge", "Alipore", "New Town"] },
  { city: "Ahmedabad", lat: 23.0225, lng: 72.5714, addresses: ["Satellite", "Vastrapur", "Bodakdev", "Navrangpura", "Maninagar"] }
];

// Helper functions
function getRandomElement(array : any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

//* Which patient groups a specialty realistically serves, so the
//* Men / Women / Children filter returns sensible doctors.
function treatsForSpecialization(specialization: string): string[] {
  switch (specialization) {
    case 'Pediatrics':
      return ['CHILDREN'];
    case 'Gynecology':
      return ['WOMEN'];
    case 'Urology':
      return ['MEN', 'WOMEN'];
    default:
      return ['MEN', 'WOMEN', 'CHILDREN'];
  }
}

function generateHours() {
  return {
    monday: { open: "09:00", close: "18:00" },
    tuesday: { open: "09:00", close: "18:00" },
    wednesday: { open: "09:00", close: "18:00" },
    thursday: { open: "09:00", close: "18:00" },
    friday: { open: "09:00", close: "18:00" },
    saturday: { open: "09:00", close: "14:00" },
    sunday: { open: "10:00", close: "13:00" }
  };
}

function generateAvailability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.map(day => ({
    day,
    startTime: "09:00",
    endTime: day === 'Saturday' ? "14:00" : "17:00"
  }));
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.testResult.deleteMany();
    await prisma.medicalTest.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.review.deleteMany();
    await prisma.lab.deleteMany();
    await prisma.hospital.deleteMany();
    await prisma.location.deleteMany();

    // Create locations
    console.log('📍 Creating locations...');
    const createdLocations = [];
    
    for (const locationData of locations) {
      for (let j = 0; j < locationData.addresses.length; j++) {
        const location = await prisma.location.create({
          data: {
            lat: locationData.lat + (Math.random() - 0.5) * 0.1, // Add some variation
            lng: locationData.lng + (Math.random() - 0.5) * 0.1,
            address: `${locationData.addresses[j]}, ${locationData.city}`
          }
        });
        createdLocations.push(location);
      }
    }

    // Create hospitals with doctors
    console.log('🏥 Creating hospitals and doctors...');
    const createdHospitals = [];
    
    for (let i = 0; i < 20; i++) {
      const location = getRandomElement(createdLocations);
      
      const hospital = await prisma.hospital.create({
        data: {
          name: hospitalNames[i],
          picture: HOSPITAL_IMAGE,
          banner: HOSPITAL_BANNER,
          address: location.address,
          departments: getRandomElements(departments, getRandomNumber(6, 10)),
          facilities: getRandomElements(facilities, getRandomNumber(8, 12)),
          services: getRandomElements(services, getRandomNumber(4, 8)),
          hours: generateHours(),
          noOfPatients: getRandomNumber(500, 5000),
          locationId: location.id,
          description: `${hospitalNames[i]} is a leading healthcare facility providing comprehensive medical services with state-of-the-art infrastructure and experienced medical professionals.`
        }
      });

      createdHospitals.push(hospital);

      // Create 4-6 doctors for each hospital
      const doctorCount = getRandomNumber(4, 6);
      for (let j = 0; j < doctorCount; j++) {
        const isMale = Math.random() > 0.5;
        const doctorName = getRandomElement(isMale ? doctorNames.male : doctorNames.female);
        const specialization = getRandomElement(specializations);
        
        const doctor = await prisma.doctor.create({
          data: {
            email: `${doctorName.toLowerCase().replace(/[^a-z]/g, '')}@${hospitalNames[i].toLowerCase().replace(/[^a-z]/g, '')}.com`,
            name: doctorName,
            phone: `+91${getRandomNumber(7000000000, 9999999999)}`,
            picture: isMale ? DOCTOR_MALE_IMAGE : DOCTOR_FEMALE_IMAGE,
            specialization: [specialization],
            treats: treatsForSpecialization(specialization),
            qualifications: getRandomElement(qualifications),
            ratings: getRandomFloat(3.5, 5.0, 1),
            about: `${doctorName} is a highly experienced ${specialization} specialist with over ${getRandomNumber(5, 25)} years of practice. Dedicated to providing excellent patient care and treatment.`,
            price: getRandomNumber(500, 2000),
            noOfPatients: getRandomNumber(100, 1000),
            hospitalId: hospital.id
          }
        });

        // Create availability for each doctor
        const availabilityData = generateAvailability();
        for (const avail of availabilityData) {
          await prisma.availability.create({
            data: {
              day: avail.day,
              startTime: avail.startTime,
              endTime: avail.endTime,
              doctorId: doctor.id
            }
          });
        }
      }

      console.log(`✅ Created hospital: ${hospital.name} with ${doctorCount} doctors`);
    }

    // Create labs with tests
    console.log('🧪 Creating labs and medical tests...');
    
    for (let i = 0; i < 10; i++) {
      const location = getRandomElement(createdLocations);
      const hospitalId = Math.random() > 0.3 ? getRandomElement(createdHospitals).id : null; // 70% chance to be associated with a hospital
      
      const lab = await prisma.lab.create({
        data: {
          name: labNames[i],
          picture: LAB_IMAGE,
          banner: LAB_BANNER,
          address: location.address,
          services: getRandomElements(labServices, getRandomNumber(6, 10)),
          hours: generateAvailability(),
          noOfPatients: getRandomNumber(200, 2000),
          locationId: location.id,
          hospitalId: hospitalId,
          description: `${labNames[i]} offers comprehensive diagnostic services with advanced technology and accurate results. We provide a wide range of pathology and radiology services.`
        }
      });

      // Create availability for lab
      const availabilityData = generateAvailability();
      for (const avail of availabilityData) {
        await prisma.availability.create({
          data: {
            day: avail.day,
            startTime: avail.startTime,
            endTime: avail.endTime,
            labId: lab.id
          }
        });
      }

      // Add medical tests to each lab
      const testsToAdd = getRandomElements(medicalTests, getRandomNumber(5, 8));
      for (const testData of testsToAdd) {
        await prisma.medicalTest.create({
          data: {
            ...testData,
            price: testData.price + getRandomNumber(-50, 100), // Add some price variation
            labId: lab.id
          }
        });
      }

      console.log(`✅ Created lab: ${lab.name} with ${testsToAdd.length} tests`);
    }

    // Create some sample reviews
    console.log('⭐ Creating sample reviews...');
    const hospitals = await prisma.hospital.findMany({ include: { doctors: true } });
    
    for (const hospital of hospitals.slice(0, 10)) { // Add reviews to first 10 hospitals
      // Hospital review
      await prisma.review.create({
        data: {
          rating: getRandomNumber(3, 5),
          comment: `Great hospital with excellent facilities and caring staff. Highly recommended for quality healthcare services.`,
          hospitalId: hospital.id
        }
      });

      // Doctor reviews
      for (const doctor of hospital.doctors.slice(0, 2)) { // Add reviews to first 2 doctors of each hospital
        await prisma.review.create({
          data: {
            rating: getRandomNumber(4, 5),
            comment: `Dr. ${doctor.name.split(' ')[1]} is very professional and knowledgeable. Excellent bedside manner and thorough examination.`,
            doctorId: doctor.id
          }
        });
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created:
    - ${createdLocations.length} locations
    - 20 hospitals
    - ~${20 * 5} doctors (4-6 per hospital)
    - 10 labs
    - ~${10 * 6} medical tests
    - Sample reviews
    `);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
export {};
