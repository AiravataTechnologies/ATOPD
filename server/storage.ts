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
  hospitalId: string;
  hospitalCode: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  hospitalType: string;
  opdDepartments: string[];
  hospitalImage?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  totalBeds?: number;
  emergencyServices: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertHospital = {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  hospitalType: string;
  opdDepartments: string[];
  hospitalImage?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  totalBeds?: number;
  emergencyServices?: boolean;
};

export type UpdateHospital = {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  hospitalType: string;
  opdDepartments: string[];
  hospitalImage?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  totalBeds?: number;
  emergencyServices: boolean;
  updatedAt: Date;
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
  doctorImage?: string;
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
  doctorImage?: string;
};

export type UpdateDoctor = {
  name?: string;
  email?: string;
  mobileNumber?: string;
  specialization?: string;
  availableTimeSlots?: string[];
  qualification?: string;
  experienceYears?: number;
  doctorLicenseId?: string;
  doctorImage?: string;
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

export type UpdatePatient = Partial<InsertPatient>;

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Hospital methods
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getHospital(id: string): Promise<Hospital | undefined>;
  updateHospital(id: string, hospital: UpdateHospital): Promise<Hospital | undefined>;
  deleteHospital(id: string): Promise<boolean>;
  getAllHospitals(): Promise<Hospital[]>;
  getHospitalByCode(code: string): Promise<Hospital | undefined>;
  generateHospitalId(): Promise<string>;
  generateHospitalCode(name: string, state: string): Promise<string>;

  // OPD methods
  createOPD(opd: InsertOPD): Promise<OPD>;
  getOPD(id: string): Promise<OPD | undefined>;
  getOPDsByHospital(hospitalId: string): Promise<OPD[]>;
  getAllOPDs(): Promise<OPD[]>;

  // Doctor methods
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  updateDoctor(id: string, doctor: UpdateDoctor): Promise<Doctor | undefined>;
  deleteDoctor(id: string): Promise<boolean>;
  getDoctorsByOPD(opdId: string): Promise<Doctor[]>;
  getAllDoctors(): Promise<Doctor[]>;

  // Patient methods  
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  updatePatient(id: string, patient: UpdatePatient): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  getAllPatients(): Promise<Patient[]>;
  getRecentPatients(limit: number): Promise<Patient[]>;
  getPatientsByDoctor(doctorId: string): Promise<Patient[]>;

  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  updatePrescription(id: string, prescription: UpdatePrescription): Promise<Prescription | undefined>;
  deletePrescription(id: string): Promise<boolean>;
  getAllPrescriptions(): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]>;

  // Medical Record methods
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]>;
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
  async generateHospitalId(): Promise<string> {
    const db = await this.getDb();
    const count = await db.collection("hospitals").countDocuments();
    return `HOS${(count + 1).toString().padStart(4, '0')}`;
  }

  async generateHospitalCode(name: string, state: string): Promise<string> {
    const db = await this.getDb();
    // Generate unique code based on hospital name initials and state
    const nameInitials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
    const stateInitials = state.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
    
    let counter = 1;
    let code = `${nameInitials}_${stateInitials}_${counter.toString().padStart(3, '0')}`;
    
    // Check if code exists, increment until unique
    while (await db.collection("hospitals").findOne({ hospitalCode: code })) {
      counter++;
      code = `${nameInitials}_${stateInitials}_${counter.toString().padStart(3, '0')}`;
    }
    
    return code;
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const db = await this.getDb();
    const hospitalId = await this.generateHospitalId();
    const hospitalCode = await this.generateHospitalCode(hospital.name, (hospital as any).state || 'XX');
    
    // Generate unique username and password
    const username = hospitalCode.toLowerCase();
    const password = this.generatePassword();
    
    const hospitalData = {
      ...hospital,
      hospitalId,
      hospitalCode,
      username,
      password,
      emergencyServices: hospital.emergencyServices || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection("hospitals").insertOne(hospitalData);
    const newHospital = await db.collection("hospitals").findOne({ _id: result.insertedId });
    return convertToTypedDocument<Hospital>(newHospital!);
  }

  private generatePassword(): string {
    // Generate a secure 8-character password with mixed case, numbers, and symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async updateHospital(id: string, hospital: UpdateHospital): Promise<Hospital | undefined> {
    const db = await this.getDb();
    const updateData = {
      ...hospital,
      updatedAt: new Date()
    };
    const result = await db.collection("hospitals").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result ? convertToTypedDocument<Hospital>(result) : undefined;
  }

  async deleteHospital(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection("hospitals").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getHospitalByCode(code: string): Promise<Hospital | undefined> {
    const db = await this.getDb();
    const hospital = await db.collection("hospitals").findOne({ hospitalCode: code });
    return hospital ? convertToTypedDocument<Hospital>(hospital) : undefined;
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

  async updateDoctor(id: string, doctor: UpdateDoctor): Promise<Doctor | undefined> {
    const db = await this.getDb();
    const result = await db.collection("doctors").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: doctor },
      { returnDocument: 'after' }
    );
    return result ? convertToTypedDocument<Doctor>(result) : undefined;
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection("doctors").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
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

  async updatePatient(id: string, patient: UpdatePatient): Promise<Patient | undefined> {
    const db = await this.getDb();
    const result = await db.collection("patients").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: patient },
      { returnDocument: 'after' }
    );
    return result ? convertToTypedDocument<Patient>(result) : undefined;
  }

  async deletePatient(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection("patients").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    const db = await this.getDb();
    const patients = await db.collection("patients").find({ doctorId }).sort({ registrationDate: -1 }).toArray();
    return patients.map(p => convertToTypedDocument<Patient>(p));
  }

  async updatePatient(id: string, updatePatient: UpdatePatient): Promise<Patient | undefined> {
    const db = await this.getDb();
    const result = await db.collection("patients").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatePatient },
      { returnDocument: 'after' }
    );
    return result ? convertToTypedDocument<Patient>(result) : undefined;
  }

  async deletePatient(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection("patients").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Prescription methods
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const db = await this.getDb();
    
    // Generate unique prescription ID
    const lastPrescription = await db.collection("prescriptions")
      .findOne({}, { sort: { prescriptionId: -1 } });
    
    let nextPrescriptionNumber = 1;
    if (lastPrescription && lastPrescription.prescriptionId) {
      const lastNumber = parseInt(lastPrescription.prescriptionId.replace("PRESC", ""));
      nextPrescriptionNumber = lastNumber + 1;
    }
    
    const prescriptionId = `PRESC${nextPrescriptionNumber.toString().padStart(4, "0")}`;

    const prescriptionData = {
      ...insertPrescription,
      prescriptionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("prescriptions").insertOne(prescriptionData);
    const newPrescription = await db.collection("prescriptions").findOne({ _id: result.insertedId });
    return convertToTypedDocument<Prescription>(newPrescription!);
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const db = await this.getDb();
    const prescription = await db.collection("prescriptions").findOne({ _id: new ObjectId(id) });
    return prescription ? convertToTypedDocument<Prescription>(prescription) : undefined;
  }

  async updatePrescription(id: string, updatePrescription: UpdatePrescription): Promise<Prescription | undefined> {
    const db = await this.getDb();
    const result = await db.collection("prescriptions").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updatePrescription, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result ? convertToTypedDocument<Prescription>(result) : undefined;
  }

  async deletePrescription(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection("prescriptions").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllPrescriptions(): Promise<Prescription[]> {
    const db = await this.getDb();
    const prescriptions = await db.collection("prescriptions").find({}).sort({ createdAt: -1 }).toArray();
    return prescriptions.map(p => convertToTypedDocument<Prescription>(p));
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    const db = await this.getDb();
    const prescriptions = await db.collection("prescriptions").find({ patientId }).sort({ createdAt: -1 }).toArray();
    return prescriptions.map(p => convertToTypedDocument<Prescription>(p));
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    const db = await this.getDb();
    const prescriptions = await db.collection("prescriptions").find({ doctorId }).sort({ createdAt: -1 }).toArray();
    return prescriptions.map(p => convertToTypedDocument<Prescription>(p));
  }

  // Medical Record methods
  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const db = await this.getDb();
    
    // Generate unique record ID
    const lastRecord = await db.collection("medical_records")
      .findOne({}, { sort: { recordId: -1 } });
    
    let nextRecordNumber = 1;
    if (lastRecord && lastRecord.recordId) {
      const lastNumber = parseInt(lastRecord.recordId.replace("REC", ""));
      nextRecordNumber = lastNumber + 1;
    }
    
    const recordId = `REC${nextRecordNumber.toString().padStart(4, "0")}`;

    const recordData = {
      ...insertRecord,
      recordId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("medical_records").insertOne(recordData);
    const newRecord = await db.collection("medical_records").findOne({ _id: result.insertedId });
    return convertToTypedDocument<MedicalRecord>(newRecord!);
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    const db = await this.getDb();
    const record = await db.collection("medical_records").findOne({ _id: new ObjectId(id) });
    return record ? convertToTypedDocument<MedicalRecord>(record) : undefined;
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    const db = await this.getDb();
    const records = await db.collection("medical_records").find({ patientId }).sort({ createdAt: -1 }).toArray();
    return records.map(r => convertToTypedDocument<MedicalRecord>(r));
  }

  async getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    const db = await this.getDb();
    const records = await db.collection("medical_records").find({ doctorId }).sort({ createdAt: -1 }).toArray();
    return records.map(r => convertToTypedDocument<MedicalRecord>(r));
  }
}

export const storage = new DatabaseStorage();