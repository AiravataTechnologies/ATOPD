import { z } from "zod";

// Zod schemas for MongoDB documents (using string IDs for frontend compatibility)

// Hospital schema
export const hospitalSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  contactNumber: z.string(),
  email: z.string().email(),
  licenseNumber: z.string(),
  hospitalType: z.string(),
  opdDepartments: z.array(z.string()).default([]), // Changed from numberOfOpdDepartments
  createdAt: z.date().default(() => new Date()),
});

// Predefined OPD department types
export const OPD_DEPARTMENTS = ["General", "ENT", "Cardio", "Gyno"] as const;

// OPD schema
export const opdSchema = z.object({
  _id: z.string().optional(),
  hospitalId: z.string(),
  name: z.string(),
  roomNumber: z.string(),
  timings: z.string(),
  operationDays: z.array(z.string()),
  departmentHead: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Doctor schema
export const doctorSchema = z.object({
  _id: z.string().optional(),
  opdId: z.string(),
  name: z.string(),
  email: z.string().email(),
  mobileNumber: z.string(),
  specialization: z.string(),
  availableTimeSlots: z.array(z.string()),
  qualification: z.string(),
  experienceYears: z.number(),
  doctorLicenseId: z.string(),
  createdAt: z.date().default(() => new Date()),
});

// Patient schema
export const patientSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  
  // Personal Information
  fullName: z.string(),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.date(),
  age: z.number().optional(),
  bloodGroup: z.string().optional(),
  
  // Contact Details
  mobileNumber: z.string(),
  email: z.string().email().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  
  // Medical Details
  weight: z.number().optional(),
  height: z.number().optional(),
  existingConditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  pastDiseases: z.array(z.string()).default([]),
  familyHistory: z.string().optional(),
  
  // Visit/Appointment Info
  visitType: z.enum(["New", "Follow-up"]),
  doctorId: z.string(),
  opdId: z.string(),
  hospitalId: z.string(),
  appointmentDate: z.date(),
  symptoms: z.string(),
  
  // Emergency Contact
  emergencyContactName: z.string(),
  emergencyContactNumber: z.string(),
  relationWithPatient: z.string(),
  
  // Other Fields
  photo: z.string().optional(),
  registrationDate: z.date().default(() => new Date()),
});

// User schema (if needed)
export const userSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  password: z.string(),
});

// Insert schemas (omitting _id and auto-generated fields)
export const insertHospitalSchema = hospitalSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertOpdSchema = opdSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertDoctorSchema = doctorSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertPatientSchema = patientSchema.omit({
  _id: true,
  patientId: true,
  registrationDate: true,
  opdId: true,
  hospitalId: true,
}).extend({
  dob: z.coerce.date(),
  appointmentDate: z.coerce.date(),
});

export const insertUserSchema = userSchema.omit({
  _id: true,
});

// Types
export type Hospital = z.infer<typeof hospitalSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Opd = z.infer<typeof opdSchema>;
export type InsertOpd = z.infer<typeof insertOpdSchema>;

export type Doctor = z.infer<typeof doctorSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Patient = z.infer<typeof patientSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
