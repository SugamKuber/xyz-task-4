import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const cloudId = process.env.CLOUD_ID;
const apiKey = process.env.API_KEY;

export const esClient = new Client({
  cloud: {
    id: cloudId,
  },
  auth: {
    apiKey: apiKey,
  },
});