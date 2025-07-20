import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Hospital table
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  licenseNumber: text("license_number").notNull(),
  hospitalType: text("hospital_type").notNull(),
  numberOfOpdDepartments: integer("number_of_opd_departments").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OPD table
export const opds = pgTable("opds", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  name: text("name").notNull(),
  roomNumber: text("room_number").notNull(),
  timings: text("timings").notNull(),
  operationDays: text("operation_days").array().notNull(),
  departmentHead: text("department_head"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Doctor table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  opdId: integer("opd_id").references(() => opds.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  specialization: text("specialization").notNull(),
  availableTimeSlots: text("available_time_slots").array().notNull(),
  qualification: text("qualification").notNull(),
  experienceYears: integer("experience_years").notNull(),
  doctorLicenseId: text("doctor_license_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  
  // Personal Information
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull(),
  dob: timestamp("dob").notNull(),
  age: integer("age"),
  bloodGroup: text("blood_group"),
  
  // Contact Details
  mobileNumber: text("mobile_number").notNull(),
  email: text("email"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pinCode: text("pin_code").notNull(),
  
  // Medical Details
  weight: numeric("weight", { precision: 5, scale: 2 }),
  height: integer("height"),
  existingConditions: text("existing_conditions").array(),
  allergies: text("allergies").array(),
  medications: text("medications").array(),
  pastDiseases: text("past_diseases").array(),
  familyHistory: text("family_history"),
  
  // Visit/Appointment Info
  visitType: text("visit_type").notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  opdId: integer("opd_id").references(() => opds.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  symptoms: text("symptoms").notNull(),
  
  // Emergency Contact
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactNumber: text("emergency_contact_number").notNull(),
  relationWithPatient: text("relation_with_patient").notNull(),
  
  // Other Fields
  photo: text("photo"),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
});

// Relations
export const hospitalRelations = relations(hospitals, ({ many }) => ({
  opds: many(opds),
  patients: many(patients),
}));

export const opdRelations = relations(opds, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [opds.hospitalId],
    references: [hospitals.id],
  }),
  doctors: many(doctors),
  patients: many(patients),
}));

export const doctorRelations = relations(doctors, ({ one, many }) => ({
  opd: one(opds, {
    fields: [doctors.opdId],
    references: [opds.id],
  }),
  patients: many(patients),
}));

export const patientRelations = relations(patients, ({ one }) => ({
  doctor: one(doctors, {
    fields: [patients.doctorId],
    references: [doctors.id],
  }),
  opd: one(opds, {
    fields: [patients.opdId],
    references: [opds.id],
  }),
  hospital: one(hospitals, {
    fields: [patients.hospitalId],
    references: [hospitals.id],
  }),
}));

// Insert schemas
export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});

export const insertOpdSchema = createInsertSchema(opds).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
  registrationDate: true,
  opdId: true,
  hospitalId: true,
});

// Types
export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Opd = typeof opds.$inferSelect;
export type InsertOpd = z.infer<typeof insertOpdSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

// Remove old user schema that's not needed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
