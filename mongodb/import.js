// Usage:
//   node import.js [dbName] [connectionString]
// If dbName is omitted, defaults to "vic_edu"
// If connectionString is omitted, defaults to "mongodb://localhost:27017"

const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

(async () => {
  const args = process.argv.slice(2);
  const dbName = args[0] || "vic_edu";
  const connectionString = args[1] || "mongodb://localhost:27017";

  function log(msg) {
    console.log(`[import] ${msg}`);
  }

  function getJsonFiles() {
    const currentDir = __dirname;
    const files = fs.readdirSync(currentDir);
    return files.filter((f) => f.match(/^vic_edu\..+\.json$/i));
  }

  function collectionNameFromFile(fileName) {
    // Expect format: vic_edu.<collection>.json
    const parts = fileName.split(".");
    if (parts.length < 3) return null;
    // Take the last part before .json, after the first prefix
    // For names like vic_edu.order_items.json -> [vic_edu, order_items, json]
    return parts.slice(1, -1).join(".");
  }

  function parseJsonEjson(filePath) {
    try {
      const text = fs.readFileSync(filePath, "utf8");
      // Parse Extended JSON format ($oid, $date)
      const parsed = JSON.parse(text, (key, value) => {
        if (value && typeof value === "object") {
          if (value.$oid) {
            return new ObjectId(value.$oid);
          }
          if (value.$date) {
            // Support both ISO string and { $numberLong: "..." }
            if (typeof value.$date === "string") {
              return new Date(value.$date);
            }
            if (
              value.$date &&
              typeof value.$date === "object" &&
              value.$date.$numberLong
            ) {
              const ms = Number(value.$date.$numberLong);
              return new Date(ms);
            }
            return new Date(value.$date);
          }
        }
        return value;
      });
      return parsed;
    } catch (e) {
      throw new Error(`Failed to parse JSON file ${filePath}: ${e.message}`);
    }
  }

  async function upsertDocuments(collection, docs) {
    if (!Array.isArray(docs)) {
      docs = [docs];
    }
    if (docs.length === 0) return { upsertedCount: 0 };

    const operations = docs.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));

    return await collection.bulkWrite(operations, { ordered: false });
  }

  let client;
  try {
    log(`Connecting to MongoDB at ${connectionString}`);
    client = new MongoClient(connectionString);
    await client.connect();

    const targetDb = client.db(dbName);
    log(`Starting import into database: ${dbName}`);

    const files = getJsonFiles();
    if (!files.length) {
      log(
        "No files matching pattern vic_edu.*.json found in current directory."
      );
      return;
    }

    // Optional: ensure predictable order for dependencies
    const orderHint = [
      "users",
      "categories",
      "books",
      "courses",
      "lessons",
      "enrollments",
      "orders",
      "order_items",
      "reviews",
      "payments",
      "vip_plans",
      "vip_subscriptions",
      "recommendations",
      "google_classrooms",
      "email_notifications",
    ];

    const fileInfos = files
      .map((f) => ({
        file: f,
        coll: collectionNameFromFile(f),
      }))
      .filter((x) => !!x.coll);

    fileInfos.sort((a, b) => {
      const ai = orderHint.indexOf(a.coll);
      const bi = orderHint.indexOf(b.coll);
      if (ai === -1 && bi === -1) return a.coll.localeCompare(b.coll);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    for (const { file, coll } of fileInfos) {
      try {
        log(`Reading ${file} → collection ${coll}`);
        const filePath = path.join(__dirname, file);
        const docs = parseJsonEjson(filePath);
        const collection = targetDb.collection(coll);
        const result = await upsertDocuments(collection, docs);
        const upserts = result.upsertedCount || 0;
        const modified = result.modifiedCount || 0;
        log(
          `Imported ${docs.length} docs into ${coll} (upserted: ${upserts}, modified: ${modified}).`
        );
      } catch (err) {
        log(`Error importing ${file}: ${err.message || err}`);
        throw err;
      }
    }

    log("Import completed successfully.");
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      log("Connection closed.");
    }
  }
})();
