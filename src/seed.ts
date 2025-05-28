import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a Location
  const location = await prisma.location.create({
    data: {
      lat: 12.9716,
      lng: 77.5946,
      address: '123 Main St, Bengaluru, India'
    }
  })

  // Create a Hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'CityCare Hospital',
      departments: ['Cardiology', 'Neurology'],
      facilities: ['ICU', 'MRI', 'Pharmacy'],
      services: ['Consultation', 'Surgery'],
      hours: '24/7',
      locationId: location.id
    }
  })

  // Create a Lab
  const lab = await prisma.lab.create({
    data: {
      name: 'CityCare Diagnostics',
      services: ['Blood Test', 'X-Ray'],
      hospitalId: hospital.id,
      locationId: location.id
    }
  })

  // Create a Doctor User
  const doctorPassword = await hash('doctor123', 10)
  const doctorUser = await prisma.user.create({
    data: {
      email: 'doc@example.com',
      password: doctorPassword,
      name: 'Dr. John Doe',
      role: 'DOCTOR',
      verified: true,
      profile: {
        create: {
          gender: 'Male',
          dob: new Date('1980-05-01'),
          address: 'Doctor St, Bengaluru',
          locationId: location.id
        }
      },
      doctor: {
        create: {
          specialization: ['Cardiology'],
          qualifications: ['MBBS', 'MD'],
          price: 500
        }
      }
    },
    include: {
      doctor: true
    }
  })

  // Create a Patient User
  const patientPassword = await hash('patient123', 10)
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@example.com',
      password: patientPassword,
      name: 'Alice Smith',
      role: 'PATIENT',
      verified: true,
      profile: {
        create: {
          gender: 'Female',
          dob: new Date('1995-07-15'),
          address: 'Patient Lane, Bengaluru',
          locationId: location.id
        }
      },
      medicalRecord: {
        create: {
          history: ['Asthma'],
          documents: ['asthma-report.pdf']
        }
      }
    }
  })

  // Create Medical Test
  const test = await prisma.medicalTest.create({
    data: {
      name: 'Complete Blood Count',
      category: 'Blood Test',
      price: 299.0,
      homeSample: true,
      labId: lab.id
    }
  })

  // Create Appointment
  await prisma.appointment.create({
    data: {
      userId: patientUser.id,
      doctorId: doctorUser.doctor!.id,
      labId: lab.id,
      testId: test.id,
      status: 'CONFIRMED',
      scheduledAt: new Date()
    }
  })

  // Create Notification
  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      type: 'CONFIRMED',
      message: 'Your appointment has been confirmed.'
    }
  })

  // Create Payment
  await prisma.payment.create({
    data: {
      userId: patientUser.id,
      amount: 299.0,
      method: 'CARD',
      status: 'PAID',
      paidAt: new Date()
    }
  })

  console.log('Seed data created successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
