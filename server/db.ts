import { MongoClient, Db } from "mongodb";

const MONGODB_URI = "mongodb+srv://airavatatechnologiesprojects:JayShreeRam%4027@atopd.436ykvh.mongodb.net/?retryWrites=true&w=majority&appName=ATOPD";

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is required");
}

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("atopd");
    console.log("Connected to MongoDB");
  }
  return { client, db };
}

export function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase first.");
  }
  return db;
}