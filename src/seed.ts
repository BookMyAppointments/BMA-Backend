import { PrismaClient, Role, AppointmentStatus } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean existing data
  await prisma.$transaction([
    prisma.testResult.deleteMany(),
    prisma.medicalTest.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.availability.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.lab.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.location.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create locations
  const location = await prisma.location.create({
    data: {
      lat: 28.6139,
      lng: 77.2090,
      address: "Connaught Place, New Delhi"
    }
  });

  // Create hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: "City General Hospital",
      departments: ["Cardiology", "Neurology", "Orthopedics"],
      facilities: ["ICU", "Emergency", "Operation Theatre"],
      services: ["24x7 Emergency", "Ambulance", "Pharmacy"],
      hours: {
        monday: "9:00-18:00",
        tuesday: "9:00-18:00",
        wednesday: "9:00-18:00",
        thursday: "9:00-18:00",
        friday: "9:00-18:00"
      },
      locationId: location.id
    }
  });

  // Create doctors
  const doctor = await prisma.doctor.create({
    data: {
      email: "doctor@example.com",
      name: "Dr. John Doe",
      phone: "+919876543210",
      specialization: ["Cardiology", "Internal Medicine"],
      qualifications: ["MBBS", "MD"],
      price: 1000,
      about: "Experienced cardiologist with 15 years of practice",
      hospitalId: hospital.id
    }
  });

  // Create lab
  const lab = await prisma.lab.create({
    data: {
      name: "City Diagnostics",
      services: ["Blood Tests", "X-Ray", "MRI", "CT Scan"],
      locationId: location.id,
      hospitalId: hospital.id
    }
  });

  // Create medical tests
  const medicalTests = await prisma.medicalTest.createMany({
    data: [
      {
        name: "Complete Blood Count",
        category: "HEMATOLOGY",
        price: 499,
        homeSample: true,
        labId: lab.id
      },
      {
        name: "Lipid Profile",
        category: "BIOCHEMISTRY",
        price: 699,
        homeSample: true,
        labId: lab.id
      },
      {
        name: "MRI Brain",
        category: "RADIOLOGY",
        price: 8999,
        homeSample: false,
        labId: lab.id
      }
    ]
  });

  // Create availability slots
  const availability = await prisma.availability.create({
    data: {
      doctorId: doctor.id,
      day: "Monday",
      startTime: "09:00",
      endTime: "17:00"
    }
  });

  // Create a normal user
  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: "hashedPassword123", // In production, use bcrypt
      name: "John Smith",
      phone: "+919876543211",
      role: Role.NORMAL,
      locationId: location.id
    }
  });

  // Create an appointment
  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      doctorId: doctor.id,
      status: AppointmentStatus.PENDING,
      scheduledAt: new Date()
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });