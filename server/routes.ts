import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHospitalSchema, insertOpdSchema, insertDoctorSchema, insertPatientSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Hospital routes
  app.post("/api/hospitals/register", async (req, res) => {
    try {
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
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

  const httpServer = createServer(app);
  return httpServer;
}
