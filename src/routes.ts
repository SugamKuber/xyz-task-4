import express from "express";
import {
  uploadSalaryData,
  developerCompensation,
  engineerCompensation,
  cityCompensationSummary,
  updateIndexMapping,
} from "./controllers/salary.controller";

const router = express.Router();

router.post("/upload", uploadSalaryData);
router.get("/engineer/avg", engineerCompensation);
router.get("/compensation", cityCompensationSummary);
// router.post("/update-mapping", async (req, res) => {
//   try {
//     await updateIndexMapping();
//     res.status(200).send("Mapping updated successfully");
//   } catch (error) {
//     res.status(500).send("Failed to update mapping");
//   }
// });
router.get("/query", developerCompensation);

export default router;
