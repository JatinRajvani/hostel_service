const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017"; 
const dbName = "hostel_service";

// Middleware
app.use(express.json());

let db, hostel;

// Connect to MongoDB and initialize collections
async function initializeDatabase() {
    try {
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        db = client.db(dbName);
        hostel = db.collection("hostel");

        // Start server after successful DB connection
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit if database connection fails
    }
}

// Initialize Database
initializeDatabase();

// Routes

// GET: List all subjects
app.get('/hostel', async (req, res) => {
    try {
        const allcollection = await hostel.find().toArray();
        res.status(200).json(allcollection);
    } catch (err) {
        res.status(500).send("Error fetching hostels: " + err.message);
    }
});

app.get('/hostel/:area', async (req, res) => {
    try {
        const area = req.params.area;
        const lower=area.toLowerCase();
        console.log(lower)
        const areaname = await hostel.findOne({ area: lower });

        if (!areaname) {
            return res.status(404).json({ message: "No hostels found in this area." });
        }

        res.status(200).json(areaname);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// For Finding the details of a hostel by its name.
app.get('/hostel/:area/:name', async (req, res) => {
    try {
        const area=req.params.area;
        const name=req.params.name;

        // Convert area and name to lowercase for case-insensitive search
        const lowerArea = area.toLowerCase();
        const lowerName = name.toLowerCase();

        // Find the hostel within the specified area by name
        const hostelData = await hostel.findOne({ 
            area: lowerArea, 
            "Places.name": { $regex: new RegExp("^" + lowerName + "$", "i") } 
        });
        //  console.log(hostelData)
        if (!hostelData) {
            return res.status(404).json({ message: "No hostel found with the given name in this area." });
        }

        // Extract the specific hostel details from the Places array
        const hostelDetail = hostelData.Places.find(place => place.name.toLowerCase() === lowerName);
        // console.log(hostelDetail)
        res.status(200).json(hostelDetail);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Post request for adding the new area with the proper data
app.post('/hostel',async (req,res)=>{
    try{
        const newdata=req.body;
        const result=await hostel.insertOne(newdata);
        res.status(201).send(`Hoste added with ID:${result.insertedId}`);
    } catch(err){
        res.status(500).send("Error adding student: " + err.message);
    }
});

//For adding the hostel details in the specified area.
app.post('/hostel/:area', async (req, res) => {
    try {
        const newHostel = req.body; // New hostel details from the request body
        const area = req.params.area;

        const result = await hostel.updateOne(
            { "area": area }, // Find document with the matching area
            { $push: { "Places": newHostel } } // Push new hostel data into Places array
        );

        if (result.matchedCount === 0) {
            return res.status(404).send(`No area found with name: ${area}`);
        }

        res.status(201).send(`Hostel added successfully.`);
    } catch (err) {
        res.status(500).send("Error adding hostel: " + err.message);
    }
});


// app.post('/subjects', async (req, res) => {
//     try {
//         console.log("req is:",req);
//         console.log("req object is:",req.body);
//         const newsubject = req.body;
//         const result = await subjects.insertOne(newsubject);
//         res.status(201).send(`Student added with ID: ${result.insertedId}`);
//     } catch (err) {
//         res.status(500).send("Error adding student: " + err.message);
//     }
// });
