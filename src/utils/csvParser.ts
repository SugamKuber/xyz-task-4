import Papa from "papaparse";
import fs from "fs";

export const parseCSV = (filePath: string) => {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(filePath);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result: any) => {
        resolve(result.data);
      },
      error: (err: any) => {
        reject(err);
      },
    });
  });
};
