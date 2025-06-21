import { PrismaClient, Role, Status, AppointmentStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data (optional - uncomment if needed)
  // await prisma.testResult.deleteMany();
  // await prisma.appointment.deleteMany();
  // await prisma.medicalTest.deleteMany();
  // await prisma.availability.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.notification.deleteMany();
  // await prisma.medicalRecord.deleteMany();
  // await prisma.request.deleteMany();
  // await prisma.doctor.deleteMany();
  // await prisma.lab.deleteMany();
  // await prisma.hospital.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.location.deleteMany();

  // Create locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        lat: 26.9124,
        lng: 75.7873,
        address: 'C-Scheme, Jaipur, Rajasthan 302001',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.8849,
        lng: 75.8069,
        address: 'Malviya Nagar, Jaipur, Rajasthan 302017',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.9390,
        lng: 75.8231,
        address: 'Civil Lines, Jaipur, Rajasthan 302006',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.8467,
        lng: 75.8056,
        address: 'Vaishali Nagar, Jaipur, Rajasthan 302021',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.9587,
        lng: 75.7804,
        address: 'Bani Park, Jaipur, Rajasthan 302016',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.8900,
        lng: 75.8367,
        address: 'Mansarovar, Jaipur, Rajasthan 302020',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.9200,
        lng: 75.8100,
        address: 'Tonk Road, Jaipur, Rajasthan 302018',
      },
    }),
    prisma.location.create({
      data: {
        lat: 26.8700,
        lng: 75.7900,
        address: 'Sodala, Jaipur, Rajasthan 302019',
      },
    }),
  ]);

  // Create hospitals
  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: 'Fortis Escorts Hospital',
        picture: 'https://example.com/fortis.jpg',
        description: 'Multi-specialty hospital with advanced medical facilities',
        banner: 'https://example.com/fortis-banner.jpg',
        address: 'Jawahar Lal Nehru Marg, Malviya Nagar, Jaipur',
        departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Emergency'],
        facilities: ['ICU', 'NICU', 'Operation Theater', 'Blood Bank', 'Pharmacy'],
        services: ['24/7 Emergency', 'Ambulance', 'Home Care', 'Telemedicine'],
        hours: {
          monday: '24/7',
          tuesday: '24/7',
          wednesday: '24/7',
          thursday: '24/7',
          friday: '24/7',
          saturday: '24/7',
          sunday: '24/7'
        },
        noOfPatients: 1250,
        locationId: locations[0].id,
      },
    }),
    prisma.hospital.create({
      data: {
        name: 'Mahatma Gandhi Medical College & Hospital',
        picture: 'https://example.com/mgmc.jpg',
        description: 'Government medical college and hospital',
        banner: 'https://example.com/mgmc-banner.jpg',
        address: 'Sitapura Industrial Area, Jaipur',
        departments: ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Psychiatry'],
        facilities: ['Emergency Ward', 'Laboratory', 'Radiology', 'Blood Bank'],
        services: ['OPD', 'IPD', 'Emergency', 'Laboratory Services'],
        hours: {
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '08:00-14:00',
          sunday: '08:00-14:00'
        },
        noOfPatients: 850,
        locationId: locations[1].id,
      },
    }),
    prisma.hospital.create({
      data: {
        name: 'Narayana Multispeciality Hospital',
        picture: 'https://example.com/narayana.jpg',
        description: 'Advanced healthcare with cutting-edge technology',
        banner: 'https://example.com/narayana-banner.jpg',
        address: 'Sector 28, Pratap Nagar, Jaipur',
        departments: ['Cardiology', 'Neurosurgery', 'Gastroenterology', 'Urology', 'Dermatology'],
        facilities: ['Cath Lab', 'MRI', 'CT Scan', 'Dialysis Unit', 'Physiotherapy'],
        services: ['Health Checkups', 'Surgical Procedures', 'Diagnostic Services'],
        hours: {
          monday: '24/7',
          tuesday: '24/7',
          wednesday: '24/7',
          thursday: '24/7',
          friday: '24/7',
          saturday: '24/7',
          sunday: '24/7'
        },
        noOfPatients: 920,
        locationId: locations[2].id,
      },
    }),
    prisma.hospital.create({
      data: {
        name: 'Apex Hospital',
        picture: 'https://example.com/apex.jpg',
        description: 'Quality healthcare with personalized care',
        banner: 'https://example.com/apex-banner.jpg',
        address: 'Sector 43, Vaishali Nagar, Jaipur',
        departments: ['Internal Medicine', 'Surgery', 'Orthopedics', 'ENT', 'Ophthalmology'],
        facilities: ['Digital X-Ray', 'Ultrasound', 'ECG', 'Laboratory', 'Pharmacy'],
        services: ['Consultation', 'Minor Surgery', 'Health Screening'],
        hours: {
          monday: '09:00-21:00',
          tuesday: '09:00-21:00',
          wednesday: '09:00-21:00',
          thursday: '09:00-21:00',
          friday: '09:00-21:00',
          saturday: '09:00-18:00',
          sunday: '10:00-16:00'
        },
        noOfPatients: 650,
        locationId: locations[3].id,
      },
    }),
    prisma.hospital.create({
      data: {
        name: 'CK Birla Hospital',
        picture: 'https://example.com/ckbirla.jpg',
        description: 'Comprehensive healthcare services',
        banner: 'https://example.com/ckbirla-banner.jpg',
        address: 'RNT Marg, Near SMS Stadium, Jaipur',
        departments: ['Cardiology', 'Pulmonology', 'Nephrology', 'Endocrinology', 'Rheumatology'],
        facilities: ['ICCU', 'Ventilator Support', 'Dialysis', '2D Echo', 'Stress Test'],
        services: ['Cardiac Care', 'Kidney Care', 'Diabetes Management'],
        hours: {
          monday: '24/7',
          tuesday: '24/7',
          wednesday: '24/7',
          thursday: '24/7',
          friday: '24/7',
          saturday: '24/7',
          sunday: '24/7'
        },
        noOfPatients: 1100,
        locationId: locations[4].id,
      },
    }),
  ]);

  // Create labs
  const labs = await Promise.all([
    prisma.lab.create({
      data: {
        name: 'Dr. Lal PathLabs',
        services: ['Blood Test', 'Urine Test', 'X-Ray', 'ECG', 'Ultrasound'],
        locationId: locations[0].id,
        hospitalId: hospitals[0].id,
      },
    }),
    prisma.lab.create({
      data: {
        name: 'SRL Diagnostics',
        services: ['Complete Blood Count', 'Lipid Profile', 'Thyroid Function', 'Diabetes Panel'],
        locationId: locations[1].id,
        hospitalId: hospitals[1].id,
      },
    }),
    prisma.lab.create({
      data: {
        name: 'Metropolis Healthcare',
        services: ['Allergy Tests', 'Hormone Tests', 'Cardiac Markers', 'Liver Function'],
        locationId: locations[2].id,
        hospitalId: hospitals[2].id,
      },
    }),
    prisma.lab.create({
      data: {
        name: 'Thyrocare Technologies',
        services: ['Thyroid Profile', 'Vitamin Tests', 'Cancer Markers', 'Infectious Disease'],
        locationId: locations[3].id,
      },
    }),
    prisma.lab.create({
      data: {
        name: 'Ganesh Diagnostic',
        services: ['MRI', 'CT Scan', 'PET Scan', 'Mammography', 'Bone Density'],
        locationId: locations[4].id,
      },
    }),
  ]);

  // Create doctors
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        email: 'dr.sharma@fortis.com',
        name: 'Dr. Rajesh Sharma',
        phone: '+91-9876543210',
        specialization: ['Cardiology', 'Internal Medicine'],
        qualifications: ['MBBS', 'MD Cardiology', 'DM Interventional Cardiology'],
        ratings: 4.8,
        about: 'Senior Cardiologist with 15+ years experience in interventional cardiology',
        price: 800,
        noOfPatients: 2500,
        hospitalId: hospitals[0].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.agarwal@fortis.com',
        name: 'Dr. Priya Agarwal',
        phone: '+91-9876543211',
        specialization: ['Neurology'],
        qualifications: ['MBBS', 'MD Neurology', 'Fellowship in Stroke Medicine'],
        ratings: 4.7,
        about: 'Neurologist specializing in stroke and epilepsy treatment',
        price: 750,
        noOfPatients: 1800,
        hospitalId: hospitals[0].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.gupta@mgmc.com',
        name: 'Dr. Suresh Gupta',
        phone: '+91-9876543212',
        specialization: ['General Surgery', 'Laparoscopic Surgery'],
        qualifications: ['MBBS', 'MS General Surgery', 'MCh Surgical Gastroenterology'],
        ratings: 4.6,
        about: 'Expert in minimally invasive surgical procedures',
        price: 600,
        noOfPatients: 2100,
        hospitalId: hospitals[1].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.verma@mgmc.com',
        name: 'Dr. Sunita Verma',
        phone: '+91-9876543213',
        specialization: ['Gynecology', 'Obstetrics'],
        qualifications: ['MBBS', 'MD Obstetrics & Gynecology', 'Fellowship in Fetal Medicine'],
        ratings: 4.9,
        about: 'Experienced gynecologist specializing in high-risk pregnancies',
        price: 550,
        noOfPatients: 3200,
        hospitalId: hospitals[1].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.jain@narayana.com',
        name: 'Dr. Amit Jain',
        phone: '+91-9876543214',
        specialization: ['Orthopedics', 'Joint Replacement'],
        qualifications: ['MBBS', 'MS Orthopedics', 'Fellowship in Joint Replacement'],
        ratings: 4.5,
        about: 'Orthopedic surgeon with expertise in knee and hip replacements',
        price: 700,
        noOfPatients: 1600,
        hospitalId: hospitals[2].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.singh@narayana.com',
        name: 'Dr. Kavita Singh',
        phone: '+91-9876543215',
        specialization: ['Dermatology', 'Cosmetology'],
        qualifications: ['MBBS', 'MD Dermatology', 'Fellowship in Cosmetic Dermatology'],
        ratings: 4.7,
        about: 'Dermatologist with expertise in skin diseases and cosmetic procedures',
        price: 500,
        noOfPatients: 2800,
        hospitalId: hospitals[2].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.mehta@apex.com',
        name: 'Dr. Rohit Mehta',
        phone: '+91-9876543216',
        specialization: ['ENT', 'Head and Neck Surgery'],
        qualifications: ['MBBS', 'MS ENT', 'Fellowship in Rhinology'],
        ratings: 4.4,
        about: 'ENT specialist with focus on nasal and sinus disorders',
        price: 450,
        noOfPatients: 1900,
        hospitalId: hospitals[3].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.patel@apex.com',
        name: 'Dr. Neha Patel',
        phone: '+91-9876543217',
        specialization: ['Ophthalmology', 'Retina Surgery'],
        qualifications: ['MBBS', 'MS Ophthalmology', 'Fellowship in Vitreo-Retinal Surgery'],
        ratings: 4.8,
        about: 'Eye specialist with expertise in retinal diseases and surgery',
        price: 600,
        noOfPatients: 2200,
        hospitalId: hospitals[3].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.malhotra@ckbirla.com',
        name: 'Dr. Vikram Malhotra',
        phone: '+91-9876543218',
        specialization: ['Pulmonology', 'Critical Care'],
        qualifications: ['MBBS', 'MD Pulmonary Medicine', 'Fellowship in Critical Care'],
        ratings: 4.6,
        about: 'Pulmonologist with expertise in respiratory diseases and critical care',
        price: 650,
        noOfPatients: 1700,
        hospitalId: hospitals[4].id,
      },
    }),
    prisma.doctor.create({
      data: {
        email: 'dr.khurana@ckbirla.com',
        name: 'Dr. Deepika Khurana',
        phone: '+91-9876543219',
        specialization: ['Endocrinology', 'Diabetes'],
        qualifications: ['MBBS', 'MD Internal Medicine', 'DM Endocrinology'],
        ratings: 4.7,
        about: 'Endocrinologist specializing in diabetes and hormonal disorders',
        price: 580,
        noOfPatients: 2400,
        hospitalId: hospitals[4].id,
      },
    }),
  ]);

  // Create users
  const hashedPassword = await hash('password123', 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@email.com',
        password: hashedPassword,
        name: 'John Doe',
        phone: '+91-8765432109',
        verified: true,
        gender: 'MALE',
        dob: new Date('1990-05-15'),
        address: 'A-123, Sector 7, Malviya Nagar, Jaipur',
        role: Role.NORMAL,
        locationId: locations[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@email.com',
        password: hashedPassword,
        name: 'Jane Smith',
        phone: '+91-8765432108',
        verified: true,
        gender: 'FEMALE',
        dob: new Date('1985-08-22'),
        address: 'B-456, Civil Lines, Jaipur',
        role: Role.NORMAL,
        locationId: locations[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@hospital.com',
        password: hashedPassword,
        name: 'Admin User',
        gender: 'MALE',
        phone: '+91-8765432107',
        verified: true,
        role: Role.ADMIN,
        locationId: locations[2].id,
      },
    }),
  ]);

  // Create availability for doctors (batch create to avoid connection issues)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const availabilityData = [];

  for (const doctor of doctors) {
    for (const day of days) {
      availabilityData.push({
        doctorId: doctor.id,
        day,
        startTime: '09:00',
        endTime: '17:00',
      });
    }
  }

  // Use createMany for batch insert
  await prisma.availability.createMany({
    data: availabilityData,
  });

  // Create medical tests
  const medicalTests = await Promise.all([
    prisma.medicalTest.create({
      data: {
        name: 'Complete Blood Count',
        category: 'Blood Test',
        price: 300,
        homeSample: true,
        labId: labs[0].id,
      },
    }),
    prisma.medicalTest.create({
      data: {
        name: 'Lipid Profile',
        category: 'Blood Test',
        price: 450,
        homeSample: true,
        labId: labs[0].id,
      },
    }),
    prisma.medicalTest.create({
      data: {
        name: 'Thyroid Function Test',
        category: 'Hormone Test',
        price: 600,
        homeSample: true,
        labId: labs[1].id,
      },
    }),
    prisma.medicalTest.create({
      data: {
        name: 'ECG',
        category: 'Cardiac Test',
        price: 200,
        homeSample: false,
        labId: labs[2].id,
      },
    }),
    prisma.medicalTest.create({
      data: {
        name: 'X-Ray Chest',
        category: 'Radiology',
        price: 350,
        homeSample: false,
        labId: labs[3].id,
      },
    }),
  ]);

  // Create reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        rating: 5,
        comment: 'Excellent treatment and care. Very professional staff.',
        doctorId: doctors[0].id,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id,
        rating: 4,
        comment: 'Good experience overall. Clean and well-maintained facility.',
        hospitalId: hospitals[0].id,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[0].id,
        rating: 5,
        comment: 'Dr. Verma is very caring and explains everything clearly.',
        doctorId: doctors[3].id,
      },
    }),
  ]);

  // Create appointments
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        userId: users[0].id,
        doctorId: doctors[0].id,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date('2025-06-25T10:00:00Z'),
      },
    }),
    prisma.appointment.create({
      data: {
        userId: users[1].id,
        labId: labs[0].id,
        testId: medicalTests[0].id,
        status: AppointmentStatus.PENDING,
        scheduledAt: new Date('2025-06-26T14:00:00Z'),
      },
    }),
    prisma.appointment.create({
      data: {
        userId: users[0].id,
        doctorId: doctors[2].id,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: new Date('2025-06-15T11:30:00Z'),
      },
    }),
  ]);

  // Create medical records
  const medicalRecords = await Promise.all([
    prisma.medicalRecord.create({
      data: {
        userId: users[0].id,
        history: ['Hypertension', 'Diabetes Type 2', 'Allergic to Penicillin'],
        documents: ['prescription_2025_01.pdf', 'lab_report_2025_02.pdf'],
      },
    }),
    prisma.medicalRecord.create({
      data: {
        userId: users[1].id,
        history: ['Asthma', 'Migraine'],
        documents: ['chest_xray_2025_01.pdf'],
      },
    }),
  ]);

  // Create notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: AppointmentStatus.CONFIRMED,
        message: 'Your appointment with Dr. Rajesh Sharma has been confirmed for June 25, 2025 at 10:00 AM',
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: AppointmentStatus.PENDING,
        message: 'Your lab test appointment is pending confirmation',
        read: false,
      },
    }),
  ]);

  // Create test results
  const testResults = await Promise.all([
    prisma.testResult.create({
      data: {
        userId: users[0].id,
        testId: medicalTests[0].id,
        result: 'Normal - All parameters within reference range',
        issuedAt: new Date('2025-06-10T09:00:00Z'),
      },
    }),
  ]);


  console.log('Database seeded successfully!');
  console.log(`Created:
    - ${locations.length} locations
    - ${hospitals.length} hospitals
    - ${labs.length} labs
    - ${doctors.length} doctors
    - ${users.length} users
    - ${availabilityData.length} availability slots
    - ${medicalTests.length} medical tests
    - ${reviews.length} reviews
    - ${appointments.length} appointments
    - ${medicalRecords.length} medical records
    - ${notifications.length} notifications
    - ${testResults.length} test results
}`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });