import { z } from "zod";

// Zod schemas for MongoDB documents (using string IDs for frontend compatibility)

// Hospital schema
export const hospitalSchema = z.object({
  _id: z.string().optional(),
  hospitalId: z.string(), // Unique hospital ID (e.g., HOS0001)
  hospitalCode: z.string(), // Unique hospital code (e.g., AT_MH_001)
  
  // Basic Information
  name: z.string(),
  registrationNumber: z.string(),
  hospitalType: z.enum(["Private", "Government", "Trust", "Clinic", "Other"]),
  specializations: z.array(z.string()).default([]), // Multi-select specializations
  
  // Address & Contact Details
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  address: z.string().optional(), // Combined address for legacy compatibility
  contactNumber: z.string(), // Landline/Mobile
  email: z.string().email(),
  website: z.string().optional(),
  
  // Administrator/Owner Details
  adminFullName: z.string(),
  adminDesignation: z.string(), // Owner, Director, Admin
  adminMobileNumber: z.string(),
  adminEmailId: z.string().email(),
  
  // Licensing & Accreditation
  licenseNumber: z.string(), // Hospital License Number/Certificate No.
  issuingAuthority: z.string(),
  licenseValidityDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  nabhAccreditation: z.boolean().default(false),
  gstNumber: z.string().optional(),
  
  // Facilities/Infrastructure
  totalBeds: z.number().optional(),
  icuBeds: z.number().optional(),
  emergencyServices: z.boolean().default(false),
  pharmacyInside: z.boolean().default(false),
  ambulanceService: z.boolean().default(false),
  
  // Login & Access Setup
  username: z.string().optional(), // Auto-generated or manually set
  password: z.string().optional(), // Encrypted
  userRole: z.string().default("Hospital Admin"),
  
  // Document URLs (stored as base64 or file paths)
  registrationCertificate: z.string().optional(),
  licenseDocument: z.string().optional(),
  gstCertificate: z.string().optional(),
  hospitalImage: z.string().optional(), // Logo for dashboard and reports
  
  // Legacy fields for compatibility
  opdDepartments: z.array(z.string()).default([]),
  description: z.string().optional(),
  establishedYear: z.number().optional(),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Predefined OPD department types
export const OPD_DEPARTMENTS = ["General", "ENT", "Cardio", "Gyno"] as const;

// Predefined specializations
export const SPECIALIZATIONS = [
  "General",
  "Cardiology", 
  "Orthopedic",
  "ENT",
  "Gynecology",
  "Pediatrics",
  "Dermatology",
  "Ophthalmology",
  "Psychiatry",
  "Neurology",
  "Gastroenterology",
  "Urology",
  "Oncology",
  "Pulmonology",
  "Nephrology",
  "Endocrinology",
  "Rheumatology",
  "Emergency Medicine",
  "Anesthesiology",
  "Radiology",
  "Pathology",
  "Other"
] as const;

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
  doctorImage: z.string().optional(), // Base64 encoded image
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
  hospitalId: true,
  hospitalCode: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  licenseValidityDate: z.coerce.date(),
});

export const updateHospitalSchema = hospitalSchema.omit({
  _id: true,
  hospitalId: true,
  hospitalCode: true,
  createdAt: true,
}).extend({
  updatedAt: z.date().default(() => new Date()),
  licenseValidityDate: z.coerce.date(),
});

export const insertOpdSchema = opdSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertDoctorSchema = doctorSchema.omit({
  _id: true,
  createdAt: true,
});

export const updateDoctorSchema = doctorSchema.omit({
  _id: true,
  opdId: true,
  createdAt: true,
}).partial();

export const insertPatientSchema = patientSchema.omit({
  _id: true,
  patientId: true,
  registrationDate: true,
});

export const updatePatientSchema = patientSchema.omit({
  _id: true,
  patientId: true,
  registrationDate: true,
}).partial();

export const insertUserSchema = userSchema.omit({
  _id: true,
});

// Types
export type Hospital = z.infer<typeof hospitalSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type UpdateHospital = z.infer<typeof updateHospitalSchema>;

export type Opd = z.infer<typeof opdSchema>;
export type InsertOpd = z.infer<typeof insertOpdSchema>;

export type Doctor = z.infer<typeof doctorSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type UpdateDoctor = z.infer<typeof updateDoctorSchema>;

export type Patient = z.infer<typeof patientSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Prescription and Medical Records Schemas
export const prescriptionSchema = z.object({
  _id: z.string().optional(),
  prescriptionId: z.string(), // Auto-generated unique ID (PRESC001, PRESC002, etc.)
  
  // Patient & Doctor Info
  patientId: z.string(),
  doctorId: z.string(),
  hospitalId: z.string(),
  opdId: z.string(),
  
  // Visit Information
  visitDate: z.date().default(() => new Date()),
  visitType: z.enum(["Follow-up", "New Consultation", "Emergency", "Check-up"]).default("New Consultation"),
  chiefComplaint: z.string(),
  symptoms: z.array(z.string()).default([]),
  
  // Clinical Examination
  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressure: z.string().optional(), // "120/80"
    pulse: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  
  // Diagnosis
  diagnosis: z.array(z.string()).default([]),
  clinicalNotes: z.string().optional(),
  
  // Prescription Details
  medications: z.array(z.object({
    medicineName: z.string(),
    dosage: z.string(), // "500mg"
    frequency: z.string(), // "Twice daily"
    duration: z.string(), // "7 days"
    instructions: z.string().optional(), // "Take after meals"
    quantity: z.number().optional(),
  })).default([]),
  
  // Digital Prescription Canvas
  prescriptionCanvas: z.string().optional(), // Base64 encoded canvas data
  prescriptionText: z.string().optional(), // OCR or manual text entry
  
  // Lab Tests & Reports
  labTests: z.array(z.object({
    testName: z.string(),
    instructions: z.string().optional(),
    urgency: z.enum(["Routine", "Urgent", "STAT"]).default("Routine"),
  })).default([]),
  
  // Follow-up
  followUpDate: z.date().optional(),
  followUpInstructions: z.string().optional(),
  
  // Status & Metadata
  status: z.enum(["Active", "Completed", "Cancelled"]).default("Active"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const medicalRecordSchema = z.object({
  _id: z.string().optional(),
  recordId: z.string(), // Auto-generated unique ID
  
  // Patient Info
  patientId: z.string(),
  hospitalId: z.string(),
  
  // Record Details
  recordType: z.enum(["Prescription", "Lab Report", "Imaging", "Discharge Summary", "Progress Note"]),
  title: z.string(),
  content: z.string(),
  
  // Associated Files/Images
  attachments: z.array(z.object({
    fileName: z.string(),
    fileType: z.string(),
    fileUrl: z.string(),
    uploadDate: z.date().default(() => new Date()),
  })).default([]),
  
  // Doctor & Visit Info
  doctorId: z.string(),
  prescriptionId: z.string().optional(), // Link to prescription if applicable
  visitDate: z.date(),
  
  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Canvas Drawing Schema for Tablet Prescription Writing
export const canvasDrawingSchema = z.object({
  _id: z.string().optional(),
  drawingId: z.string(),
  
  // Associated Records
  prescriptionId: z.string(),
  doctorId: z.string(),
  patientId: z.string(),
  
  // Canvas Data
  canvasData: z.string(), // Base64 encoded canvas image
  canvasWidth: z.number().default(800),
  canvasHeight: z.number().default(600),
  
  // Drawing Metadata
  strokes: z.array(z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
      pressure: z.number().optional(),
    })),
    color: z.string().default("#000000"),
    width: z.number().default(2),
    timestamp: z.number(),
  })).default([]),
  
  // Recognition & OCR
  recognizedText: z.string().optional(),
  confidence: z.number().optional(),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Insert Schemas
export const insertPrescriptionSchema = prescriptionSchema.omit({
  _id: true,
  prescriptionId: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePrescriptionSchema = prescriptionSchema.omit({
  _id: true,
  prescriptionId: true,
  createdAt: true,
}).extend({
  updatedAt: z.date().default(() => new Date()),
}).partial();

export const insertMedicalRecordSchema = medicalRecordSchema.omit({
  _id: true,
  recordId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCanvasDrawingSchema = canvasDrawingSchema.omit({
  _id: true,
  drawingId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Prescription = z.infer<typeof prescriptionSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type UpdatePrescription = z.infer<typeof updatePrescriptionSchema>;

export type MedicalRecord = z.infer<typeof medicalRecordSchema>;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type CanvasDrawing = z.infer<typeof canvasDrawingSchema>;
export type InsertCanvasDrawing = z.infer<typeof insertCanvasDrawingSchema>;
