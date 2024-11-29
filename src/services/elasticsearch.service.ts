import { esClient } from "../config/elasticsearch.config";

export const createIndex = async (index: string, schema: object) => {
  try {
    await esClient.indices.create({ index, body: schema });
    console.log(`Index "${index}" created successfully.`);
  } catch (err) {
    if (err.meta?.body?.error?.type !== "resource_already_exists_exception") {
      throw err;
    }
    console.log(`Index "${index}" already exists.`);
  }
};

export const uploadData = async (index: string, data: object[]) => {
  const body = data.flatMap((doc) => [{ index: { _index: index } }, doc]);
  await esClient.bulk({ refresh: true, body });
  console.log(`Uploaded ${data.length} documents to index "${index}".`);
};
