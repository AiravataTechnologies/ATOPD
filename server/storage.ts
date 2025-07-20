import { 
  hospitals, 
  opds, 
  doctors, 
  patients,
  type Hospital, 
  type InsertHospital,
  type Opd,
  type InsertOpd,
  type Doctor,
  type InsertDoctor,
  type Patient,
  type InsertPatient,
  type User,
  type InsertUser,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hospital methods
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getHospital(id: number): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;
  
  // OPD methods
  createOpd(opd: InsertOpd): Promise<Opd>;
  getOpd(id: number): Promise<Opd | undefined>;
  getOpdsByHospital(hospitalId: number): Promise<Opd[]>;
  
  // Doctor methods
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorsByOpd(opdId: number): Promise<Doctor[]>;
  getAllDoctors(): Promise<Doctor[]>;
  
  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientsByDoctor(doctorId: number): Promise<Patient[]>;
  getRecentPatients(limit?: number): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Hospital methods
  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [newHospital] = await db
      .insert(hospitals)
      .values(hospital)
      .returning();
    return newHospital;
  }

  async getHospital(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital || undefined;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals).orderBy(desc(hospitals.createdAt));
  }

  // OPD methods
  async createOpd(opd: InsertOpd): Promise<Opd> {
    const [newOpd] = await db
      .insert(opds)
      .values(opd)
      .returning();
    return newOpd;
  }

  async getOpd(id: number): Promise<Opd | undefined> {
    const [opd] = await db.select().from(opds).where(eq(opds.id, id));
    return opd || undefined;
  }

  async getOpdsByHospital(hospitalId: number): Promise<Opd[]> {
    return await db.select().from(opds).where(eq(opds.hospitalId, hospitalId));
  }

  // Doctor methods
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db
      .insert(doctors)
      .values(doctor)
      .returning();
    return newDoctor;
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor || undefined;
  }

  async getDoctorsByOpd(opdId: number): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.opdId, opdId));
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors).orderBy(desc(doctors.createdAt));
  }

  // Patient methods
  async createPatient(patient: InsertPatient): Promise<Patient> {
    // Generate unique patient ID
    const patientId = `PAT${nanoid(6).toUpperCase()}`;
    
    // Get doctor to derive opdId and hospitalId
    const doctor = await this.getDoctor(patient.doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    
    const opd = await this.getOpd(doctor.opdId);
    if (!opd) {
      throw new Error("OPD not found");
    }

    // Auto-calculate age if not provided
    let age = patient.age;
    if (!age && patient.dob) {
      const dobDate = new Date(patient.dob);
      const today = new Date();
      age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
    }

    const patientData = {
      ...patient,
      patientId,
      age,
      opdId: doctor.opdId,
      hospitalId: opd.hospitalId,
    };

    const [newPatient] = await db
      .insert(patients)
      .values(patientData)
      .returning();
    return newPatient;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.doctorId, doctorId));
  }

  async getRecentPatients(limit: number = 10): Promise<Patient[]> {
    return await db.select().from(patients)
      .orderBy(desc(patients.registrationDate))
      .limit(limit);
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.registrationDate));
  }
}

export const storage = new DatabaseStorage();
