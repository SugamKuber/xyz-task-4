import { Request, Response } from "express";
import { esClient } from "../config/elasticsearch.config";
import { parseCSV } from "../utils/csvParser";

const salaryIndexMapping = {
  index: "salary_data",
  mappings: {
    properties: {
      timestamp: { type: "date" },
      age_range: { type: "keyword" },
      industry: { type: "keyword" },
      job_title: { type: "text" },
      annual_salary: { type: "integer" },
      currency: { type: "keyword" },
      location: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
            ignore_above: 256,
          },
        },
        fielddata: true,
      },
      experience_years: { type: "keyword" },
      job_title_context: { type: "text" },
      other_currency: { type: "keyword" },
    },
  },
};

export const uploadSalaryData = async (req: Request, res: Response) => {
  try {
    const data: any = await parseCSV("src/data/salary-1.csv");

    const indexExists = await esClient.indices.exists({ index: "salary_data" });
    if (!indexExists) {
      await esClient.indices.create(salaryIndexMapping);
    }

    const bulkBody = data.flatMap((doc: any) => [
      { index: { _index: "salary_data" } },
      {
        timestamp: doc.Timestamp ? new Date(doc.Timestamp).toISOString() : null,
        age_range: doc["How old are you?"] || null,
        industry: doc["What industry do you work in?"] || null,
        job_title: doc["Job title"] || null,
        annual_salary: doc["What is your annual salary?"]
          ? parseInt(doc["What is your annual salary?"])
          : null,
        currency: doc["Please indicate the currency"] || null,
        location: doc["Where are you located? (City/state/country)"] || null,
        experience_years:
          doc[
            "How many years of post-college professional work experience do you have?"
          ] || null,
        job_title_context:
          doc[
            "If your job title needs additional context, please clarify here"
          ] || null,
        other_currency:
          doc["If 'Other,' please indicate the currency here"] || null,
      },
    ]);

    const response = await esClient.bulk({ body: bulkBody });

    if (response.errors) {
      const erroredItems = response.items.filter(
        (item: any) => item.index?.error,
      );
      console.error("Errors during bulk insert:", erroredItems);
      res.status(500).send("There were errors during data upload.");
    } else {
      console.log("Bulk insert successful");
      res.status(200).send("Data uploaded successfully");
    }
  } catch (error) {
    console.error("Error uploading salary data:", error);
    res.status(500).send("Failed to upload data");
  }
};

export const engineerCompensation = async (_req: Request, res: Response) => {
  try {
    const response = await esClient.search({
      index: "salary_data",
      body: {
        query: {
          wildcard: {
            job_title: "*engineer*",
          },
        },
        aggs: {
          avg_salary: {
            avg: {
              field: "annual_salary",
            },
          },
        },
        size: 0,
      },
    });

    const avgSalary = response.aggregations?.avg_salary;

    if (avgSalary !== undefined) {
      res.status(200).json({
        average_compensation: avgSalary,
      });
    } else {
      res.status(404).json({ message: "No engineer roles found." });
    }
  } catch (error) {
    console.error("Error fetching engineer compensation:", error);
    res.status(500).send("Failed to fetch compensation data");
  }
};

export const updateIndexMapping = async () => {
  try {
    await esClient.indices.putMapping({
      index: "salary_data",
      body: {
        properties: {
          location: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
            fielddata: true,
          },
        },
      },
    });
    console.log("Index mapping updated successfully");
  } catch (error) {
    console.error("Error updating index mapping:", error);
  }
};

export const cityCompensationSummary = async (_req: Request, res: Response) => {
  try {
    const response = await esClient.search({
      index: "salary_data",
      body: {
        size: 0,
        aggs: {
          cities: {
            terms: {
              field: "location",
              size: 100000,
              min_doc_count: 1,
            },
            aggs: {
              salary_stats: {
                stats: {
                  field: "annual_salary",
                },
              },
              currency_filter: {
                filter: {
                  term: {
                    currency: "USD",
                  },
                },
                aggs: {
                  salary_stats: {
                    stats: {
                      field: "annual_salary",
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const citiesBuckets = (response.aggregations as any)?.cities?.buckets || [];

    const citySalaryData = citiesBuckets.map((bucket: any) => ({
      city: bucket.key,
      dataPoints: bucket.doc_count,
      averageSalary: Math.round(bucket.salary_stats.avg || 0),
      minSalary: Math.round(bucket.salary_stats.min || 0),
      maxSalary: Math.round(bucket.salary_stats.max || 0),
      usdAverageSalary: bucket.currency_filter?.salary_stats?.avg
        ? Math.round(bucket.currency_filter.salary_stats.avg)
        : null,
    }));

    citySalaryData.sort(
      (a: { averageSalary: any }, b: { averageSalary: any }) =>
        (b.averageSalary || 0) - (a.averageSalary || 0),
    );

    res.status(200).json({
      totalCities: citySalaryData.length,
      cities: citySalaryData,
    });
  } catch (error) {
    console.error("Error in city compensation summary:", error);
    res.status(500).json({
      message: "Failed to fetch city compensation data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const developerCompensation = async (_req: Request, res: Response) => {
  try {
    const response = await esClient.search({
      index: "salary_data",
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  job_title: "developer",
                },
              },
            ],
            filter: [
              { range: { annual_salary: { gte: 30000 } } },
              { term: { currency: "USD" } },
            ],
          },
        },
        aggs: {
          avg_salary: {
            avg: {
              field: "annual_salary",
            },
          },
          salary_range: {
            stats: {
              field: "annual_salary",
            },
          },
          top_locations: {
            terms: {
              field: "location.keyword",
              size: 5,
            },
          },
        },
        sort: [{ annual_salary: { order: "desc" } }],
        size: 10,
        _source: ["job_title", "annual_salary", "location", "currency"],
      },
    });

    const avgSalary = response.aggregations?.avg_salary;
    const salaryStats = response.aggregations?.salary_range;
    const topLocations = response.aggregations?.top_locations || [];
    const hits = response.hits.hits.map((hit: any) => hit._source);

    if (avgSalary !== undefined) {
      res.status(200).json({
        average_compensation: avgSalary,
        salary_stats: salaryStats,
        top_locations: topLocations,
        top_records: hits,
      });
    } else {
      res.status(404).json({ message: "No developer roles found." });
    }
  } catch (error) {
    console.error("Error fetching developer compensation:", error);
    res.status(500).send("Failed to fetch compensation data");
  }
};
