import { MongoClient, Db, ObjectId } from "mongodb";
import { connectToDatabase } from "./db";

// Types from the shared schema
export type User = {
  _id?: string;
  username: string;
  password: string;
};

export type InsertUser = {
  username: string;
  password: string;
};

export type Hospital = {
  _id?: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  hospitalType: string;
  numberOfOpdDepartments: number;
  createdAt: Date;
};

export type InsertHospital = {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  hospitalType: string;
  numberOfOpdDepartments: number;
};

export type OPD = {
  _id?: string;
  hospitalId: string;
  name: string;
  roomNumber: string;
  timings: string;
  operationDays: string[];
  departmentHead?: string;
  createdAt: Date;
};

export type InsertOPD = {
  hospitalId: string;
  name: string;
  roomNumber: string;
  timings: string;
  operationDays: string[];
  departmentHead?: string;
};

export type Doctor = {
  _id?: string;
  opdId: string;
  name: string;
  email: string;
  mobileNumber: string;
  specialization: string;
  availableTimeSlots: string[];
  qualification: string;
  experienceYears: number;
  doctorLicenseId: string;
  createdAt: Date;
};

export type InsertDoctor = {
  opdId: string;
  name: string;
  email: string;
  mobileNumber: string;
  specialization: string;
  availableTimeSlots: string[];
  qualification: string;
  experienceYears: number;
  doctorLicenseId: string;
};

export type Patient = {
  _id?: string;
  patientId: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  dob: Date;
  age?: number;
  bloodGroup?: string;
  mobileNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  weight?: number;
  height?: number;
  existingConditions: string[];
  allergies: string[];
  medications: string[];
  pastDiseases: string[];
  familyHistory?: string;
  visitType: "New" | "Follow-up";
  doctorId: string;
  opdId: string;
  hospitalId: string;
  appointmentDate: Date;
  symptoms: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  relationWithPatient: string;
  photo?: string;
  registrationDate: Date;
};

export type InsertPatient = {
  fullName: string;
  gender: "Male" | "Female" | "Other";
  dob: Date;
  age?: number;
  bloodGroup?: string;
  mobileNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  weight?: number;
  height?: number;
  existingConditions: string[];
  allergies: string[];
  medications: string[];
  pastDiseases: string[];
  familyHistory?: string;
  visitType: "New" | "Follow-up";
  doctorId: string;
  appointmentDate: Date;
  symptoms: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  relationWithPatient: string;
  photo?: string;
};

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Hospital methods
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getHospital(id: string): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;

  // OPD methods
  createOPD(opd: InsertOPD): Promise<OPD>;
  getOPD(id: string): Promise<OPD | undefined>;
  getOPDsByHospital(hospitalId: string): Promise<OPD[]>;
  getAllOPDs(): Promise<OPD[]>;

  // Doctor methods
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  getDoctorsByOPD(opdId: string): Promise<Doctor[]>;
  getAllDoctors(): Promise<Doctor[]>;

  // Patient methods  
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  getRecentPatients(limit: number): Promise<Patient[]>;
  getPatientsByDoctor(doctorId: string): Promise<Patient[]>;
}

// Helper function to convert MongoDB documents to typed objects with string _id
function convertToTypedDocument<T>(doc: any): T {
  if (!doc) return doc;
  return {
    ...doc,
    _id: doc._id.toString()
  };
}

export class DatabaseStorage implements IStorage {
  private async getDb(): Promise<Db> {
    const { db } = await connectToDatabase();
    return db;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const db = await this.getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    return user ? convertToTypedDocument<User>(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDb();
    const user = await db.collection("users").findOne({ username });
    return user ? convertToTypedDocument<User>(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await this.getDb();
    const result = await db.collection("users").insertOne(insertUser);
    const newUser = await db.collection("users").findOne({ _id: result.insertedId });
    return convertToTypedDocument<User>(newUser!);
  }

  // Hospital methods
  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const db = await this.getDb();
    const hospitalData = {
      ...hospital,
      createdAt: new Date()
    };
    const result = await db.collection("hospitals").insertOne(hospitalData);
    const newHospital = await db.collection("hospitals").findOne({ _id: result.insertedId });
    return convertToTypedDocument<Hospital>(newHospital!);
  }

  async getHospital(id: string): Promise<Hospital | undefined> {
    const db = await this.getDb();
    const hospital = await db.collection("hospitals").findOne({ _id: new ObjectId(id) });
    return hospital ? convertToTypedDocument<Hospital>(hospital) : undefined;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    const db = await this.getDb();
    const hospitals = await db.collection("hospitals").find({}).sort({ createdAt: -1 }).toArray();
    return hospitals.map(h => convertToTypedDocument<Hospital>(h));
  }

  // OPD methods
  async createOPD(opd: InsertOPD): Promise<OPD> {
    const db = await this.getDb();
    const opdData = {
      ...opd,
      createdAt: new Date()
    };
    const result = await db.collection("opds").insertOne(opdData);
    const newOPD = await db.collection("opds").findOne({ _id: result.insertedId });
    return convertToTypedDocument<OPD>(newOPD!);
  }

  async getOPD(id: string): Promise<OPD | undefined> {
    const db = await this.getDb();
    const opd = await db.collection("opds").findOne({ _id: new ObjectId(id) });
    return opd ? convertToTypedDocument<OPD>(opd) : undefined;
  }

  async getOPDsByHospital(hospitalId: string): Promise<OPD[]> {
    const db = await this.getDb();
    const opds = await db.collection("opds").find({ hospitalId }).sort({ createdAt: -1 }).toArray();
    return opds.map(o => convertToTypedDocument<OPD>(o));
  }

  async getAllOPDs(): Promise<OPD[]> {
    const db = await this.getDb();
    const opds = await db.collection("opds").find({}).sort({ createdAt: -1 }).toArray();
    return opds.map(o => convertToTypedDocument<OPD>(o));
  }

  // Doctor methods
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const db = await this.getDb();
    const doctorData = {
      ...doctor,
      createdAt: new Date()
    };
    const result = await db.collection("doctors").insertOne(doctorData);
    const newDoctor = await db.collection("doctors").findOne({ _id: result.insertedId });
    return convertToTypedDocument<Doctor>(newDoctor!);
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    const db = await this.getDb();
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(id) });
    return doctor ? convertToTypedDocument<Doctor>(doctor) : undefined;
  }

  async getDoctorsByOPD(opdId: string): Promise<Doctor[]> {
    const db = await this.getDb();
    const doctors = await db.collection("doctors").find({ opdId }).sort({ createdAt: -1 }).toArray();
    return doctors.map(d => convertToTypedDocument<Doctor>(d));
  }

  async getAllDoctors(): Promise<Doctor[]> {
    const db = await this.getDb();
    const doctors = await db.collection("doctors").find({}).sort({ createdAt: -1 }).toArray();
    return doctors.map(d => convertToTypedDocument<Doctor>(d));
  }

  // Patient methods
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const db = await this.getDb();
    
    // Generate unique patient ID
    const lastPatient = await db.collection("patients")
      .findOne({}, { sort: { patientId: -1 } });
    
    let nextPatientNumber = 1;
    if (lastPatient && lastPatient.patientId) {
      const lastNumber = parseInt(lastPatient.patientId.replace("PAT", ""));
      nextPatientNumber = lastNumber + 1;
    }
    
    const patientId = `PAT${nextPatientNumber.toString().padStart(4, "0")}`;

    // Get hospital and OPD IDs from the selected doctor
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(insertPatient.doctorId) });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const patientData = {
      ...insertPatient,
      patientId,
      opdId: doctor.opdId,
      hospitalId: doctor.hospitalId || await this.getHospitalIdFromOPD(doctor.opdId),
      registrationDate: new Date(),
      existingConditions: insertPatient.existingConditions || [],
      allergies: insertPatient.allergies || [],
      medications: insertPatient.medications || [],
      pastDiseases: insertPatient.pastDiseases || []
    };

    const result = await db.collection("patients").insertOne(patientData);
    const newPatient = await db.collection("patients").findOne({ _id: result.insertedId });
    return convertToTypedDocument<Patient>(newPatient!);
  }

  private async getHospitalIdFromOPD(opdId: string): Promise<string> {
    const db = await this.getDb();
    const opd = await db.collection("opds").findOne({ _id: new ObjectId(opdId) });
    return opd?.hospitalId || "";
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const db = await this.getDb();
    const patient = await db.collection("patients").findOne({ _id: new ObjectId(id) });
    return patient ? convertToTypedDocument<Patient>(patient) : undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    const db = await this.getDb();
    const patients = await db.collection("patients").find({}).sort({ registrationDate: -1 }).toArray();
    return patients.map(p => convertToTypedDocument<Patient>(p));
  }

  async getRecentPatients(limit: number): Promise<Patient[]> {
    const db = await this.getDb();
    const patients = await db.collection("patients")
      .find({})
      .sort({ registrationDate: -1 })
      .limit(limit)
      .toArray();
    return patients.map(p => convertToTypedDocument<Patient>(p));
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    const db = await this.getDb();
    const patients = await db.collection("patients").find({ doctorId }).sort({ registrationDate: -1 }).toArray();
    return patients.map(p => convertToTypedDocument<Patient>(p));
  }
}

export const storage = new DatabaseStorage();