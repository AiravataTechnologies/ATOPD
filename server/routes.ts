import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHospitalSchema, updateHospitalSchema, insertOpdSchema, insertDoctorSchema, updateDoctorSchema, insertPatientSchema, updatePatientSchema, insertPrescriptionSchema, updatePrescriptionSchema, insertMedicalRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Hospital routes
  app.post("/api/hospitals/register", async (req, res) => {
    try {
      const parsedData = insertHospitalSchema.parse(req.body);
      // Ensure address field is present for storage interface compatibility
      const hospitalData = {
        ...parsedData,
        address: parsedData.address || `${parsedData.addressLine1}, ${parsedData.addressLine2 || ''} ${parsedData.city}, ${parsedData.state} - ${parsedData.pinCode}`.replace(/,\s*,/g, ',').trim()
      };
      const hospital = await storage.createHospital(hospitalData as any);
      res.status(201).json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register hospital", error: (error as Error).message });
    }
  });

  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals", error: (error as Error).message });
    }
  });

  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const hospital = await storage.getHospital(id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospital", error: (error as Error).message });
    }
  });

  app.put("/api/hospitals/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const parsedData = updateHospitalSchema.parse(req.body);
      // Ensure address field is present for storage interface compatibility
      const hospitalData = {
        ...parsedData,
        address: parsedData.address || `${parsedData.addressLine1}, ${parsedData.addressLine2 || ''} ${parsedData.city}, ${parsedData.state} - ${parsedData.pinCode}`.replace(/,\s*,/g, ',').trim()
      };
      const hospital = await storage.updateHospital(id, hospitalData as any);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update hospital", error: (error as Error).message });
    }
  });

  app.delete("/api/hospitals/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteHospital(id);
      if (!success) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json({ message: "Hospital deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete hospital", error: (error as Error).message });
    }
  });

  app.get("/api/hospitals/code/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const hospital = await storage.getHospitalByCode(code);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospital", error: (error as Error).message });
    }
  });

  // OPD routes
  app.post("/api/hospitals/:hospitalId/opds", async (req, res) => {
    try {
      const hospitalId = req.params.hospitalId;
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      const opdData = insertOpdSchema.parse({ ...req.body, hospitalId });
      const opd = await storage.createOPD(opdData);
      res.status(201).json(opd);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register OPD", error: (error as Error).message });
    }
  });

  app.get("/api/hospitals/:hospitalId/opds", async (req, res) => {
    try {
      const hospitalId = req.params.hospitalId;
      const opds = await storage.getOPDsByHospital(hospitalId);
      res.json(opds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OPDs", error: (error as Error).message });
    }
  });

  app.get("/api/opds", async (req, res) => {
    try {
      const opds = await storage.getAllOPDs();
      res.json(opds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OPDs", error: (error as Error).message });
    }
  });

  // Doctor routes
  app.post("/api/opds/:opdId/doctors", async (req, res) => {
    try {
      const opdId = req.params.opdId;
      const opd = await storage.getOPD(opdId);
      if (!opd) {
        return res.status(404).json({ message: "OPD not found" });
      }

      const doctorData = insertDoctorSchema.parse({ ...req.body, opdId });
      const doctor = await storage.createDoctor(doctorData);
      res.status(201).json(doctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register doctor", error: (error as Error).message });
    }
  });

  app.get("/api/opds/:opdId/doctors", async (req, res) => {
    try {
      const opdId = req.params.opdId;
      const doctors = await storage.getDoctorsByOPD(opdId);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors", error: (error as Error).message });
    }
  });

  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors", error: (error as Error).message });
    }
  });

  app.put("/api/doctors/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const doctorData = updateDoctorSchema.parse(req.body);
      const doctor = await storage.updateDoctor(id, doctorData);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update doctor", error: (error as Error).message });
    }
  });

  app.delete("/api/doctors/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteDoctor(id);
      if (!success) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete doctor", error: (error as Error).message });
    }
  });

  // Patient routes
  app.post("/api/patients/register", async (req, res) => {
    try {
      // Parse comma-separated arrays and convert dates
      const processedBody = { ...req.body };
      
      // Handle array fields
      ['existingConditions', 'allergies', 'medications', 'pastDiseases'].forEach(field => {
        if (processedBody[field] && typeof processedBody[field] === 'string') {
          processedBody[field] = processedBody[field]
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
      });

      // Handle date fields
      if (processedBody.dob) {
        processedBody.dob = new Date(processedBody.dob);
      }
      if (processedBody.appointmentDate) {
        processedBody.appointmentDate = new Date(processedBody.appointmentDate);
      }

      const patientData = insertPatientSchema.parse(processedBody);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register patient", error: (error as Error).message });
    }
  });

  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients", error: (error as Error).message });
    }
  });

  app.get("/api/patients/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const patients = await storage.getRecentPatients(limit);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent patients", error: (error as Error).message });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient", error: (error as Error).message });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const processedBody = { ...req.body };
      
      // Handle array fields
      ['existingConditions', 'allergies', 'medications', 'pastDiseases'].forEach(field => {
        if (processedBody[field] && typeof processedBody[field] === 'string') {
          processedBody[field] = processedBody[field]
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
      });

      // Handle date fields
      if (processedBody.dob) {
        processedBody.dob = new Date(processedBody.dob);
      }
      if (processedBody.appointmentDate) {
        processedBody.appointmentDate = new Date(processedBody.appointmentDate);
      }

      const patientData = updatePatientSchema.parse(processedBody);
      const patient = await storage.updatePatient(id, patientData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient", error: (error as Error).message });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient", error: (error as Error).message });
    }
  });

  // Prescription routes
  app.post("/api/prescriptions/create", async (req, res) => {
    try {
      const processedBody = { ...req.body };
      
      // Handle date fields
      if (processedBody.visitDate) {
        processedBody.visitDate = new Date(processedBody.visitDate);
      }
      if (processedBody.followUpDate) {
        processedBody.followUpDate = new Date(processedBody.followUpDate);
      }

      const prescriptionData = insertPrescriptionSchema.parse(processedBody);
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create prescription", error: (error as Error).message });
    }
  });

  app.get("/api/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getAllPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions", error: (error as Error).message });
    }
  });

  app.get("/api/prescriptions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const prescription = await storage.getPrescription(id);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescription", error: (error as Error).message });
    }
  });

  app.get("/api/prescriptions/patient/:patientId", async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const prescriptions = await storage.getPrescriptionsByPatient(patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient prescriptions", error: (error as Error).message });
    }
  });

  app.get("/api/prescriptions/doctor/:doctorId", async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
      const prescriptions = await storage.getPrescriptionsByDoctor(doctorId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor prescriptions", error: (error as Error).message });
    }
  });

  app.put("/api/prescriptions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const processedBody = { ...req.body };
      
      // Handle date fields
      if (processedBody.visitDate) {
        processedBody.visitDate = new Date(processedBody.visitDate);
      }
      if (processedBody.followUpDate) {
        processedBody.followUpDate = new Date(processedBody.followUpDate);
      }

      const prescriptionData = updatePrescriptionSchema.parse(processedBody);
      const prescription = await storage.updatePrescription(id, prescriptionData);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update prescription", error: (error as Error).message });
    }
  });

  app.delete("/api/prescriptions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deletePrescription(id);
      if (!success) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json({ message: "Prescription deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prescription", error: (error as Error).message });
    }
  });

  // Medical Record routes
  app.post("/api/medical-records/create", async (req, res) => {
    try {
      const processedBody = { ...req.body };
      
      // Handle date fields
      if (processedBody.visitDate) {
        processedBody.visitDate = new Date(processedBody.visitDate);
      }

      const recordData = insertMedicalRecordSchema.parse(processedBody);
      const record = await storage.createMedicalRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create medical record", error: (error as Error).message });
    }
  });

  app.get("/api/medical-records/patient/:patientId", async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const records = await storage.getMedicalRecordsByPatient(patientId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient medical records", error: (error as Error).message });
    }
  });

  app.get("/api/medical-records/doctor/:doctorId", async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
      const records = await storage.getMedicalRecordsByDoctor(doctorId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor medical records", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
