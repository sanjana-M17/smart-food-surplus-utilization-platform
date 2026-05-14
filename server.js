const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "4NI24IS172SANJANA",
    database: "food_surplus_system"
});

db.connect((err) => {
    if(err){
        console.log("Database connection failed", err);
    } else {
        console.log("Connected to MySQL");
    }
});

// ROUTES

app.get("/", (req,res)=>{
    res.send("Food Surplus Platform Running");
});

app.post('/register', (req, res) => {

    const { name, email, password, phone, role } = req.body;

    const sql = "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, email, password, phone, role], (err, result) => {

        if(err){
            console.log("DB ERROR:", err);
            return res.send("Error inserting data");
        }

        res.send("User Registered & Stored in Database");
    });
});
app.post('/login', (req, res) => {

    const { emailOrPhone, password } = req.body;

    const sql = `
    SELECT u.*, p.provider_id
    FROM users u
    LEFT JOIN providers p 
    ON u.user_id = p.user_id
    WHERE (u.email = ? OR u.phone = ?) 
    AND u.password = ?
    `;

    db.query(sql, [emailOrPhone, emailOrPhone, password], (err, result) => {

        if(err){
            console.log(err);
            return res.json({ success: false });
        }

        if(result.length > 0){
            res.json({
                success: true,
                user: result[0]
            });
        } else {
            res.json({ success: false });
        }

    });

});


app.post('/add-food', (req, res) => {

    const {
        provider_id,
        food_name,
        quantity,
        expiry_time,
        street,
        area,
        city,
        state,
        pincode
    } = req.body;

    const sql = `
        INSERT INTO food_listings 
        (provider_id, food_name, quantity, expiry_time, street, area, city, state, pincode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `;

    db.query(sql, [
        provider_id,
        food_name,
        quantity,
        expiry_time,
        street,
        area,
        city,
        state,
        pincode
    ], (err, result) => {

        if(err){
            console.log(err);
            return res.send("Error adding food");
        }

        res.send("Food Added Successfully");
    });

});
app.get('/available-food', (req, res) => {

    const sql = "SELECT * FROM food_listings WHERE status = 'available'";

    db.query(sql, (err, result) => {

        if(err){
            console.log(err);
            return res.send("Error fetching food");
        }

        res.json(result);
    });

});
app.post('/request-pickup', (req, res) => {

    const { food_id, volunteer_id } = req.body;

    const sql = `
        INSERT INTO pickup_requests (food_id, volunteer_id)
        VALUES (?, ?)
    `;

    db.query(sql, [food_id, volunteer_id], (err, result) => {

        if(err){
            console.log(err);
            return res.send("Error requesting pickup");
        }

        res.send("Pickup Request Sent");
    });

});
app.get('/provider-requests/:provider_id', (req, res) => {

    const provider_id = req.params.provider_id;

    const sql = `
        SELECT pr.request_id, pr.status, pr.request_time,
               f.food_name, f.quantity,
               u.name AS volunteer_name, u.phone
        FROM pickup_requests pr
        JOIN food_listings f ON pr.food_id = f.food_id
        JOIN volunteers v ON pr.volunteer_id = v.volunteer_id
        JOIN users u ON v.user_id = u.user_id
        WHERE f.provider_id = ?
    `;

    db.query(sql, [provider_id], (err, result) => {

        if(err){
            console.log(err);
            return res.send("Error fetching requests");
        }

        res.json(result);
    });

});
app.put('/update-request-status/:id', (req, res) => {

    const requestId = req.params.id;

    const { status } = req.body;

    let sql = "";
    let values = [];

    if(status === "accepted"){

        sql = `
        UPDATE pickup_requests
        SET status = ?, pickup_time = NOW()
        WHERE request_id = ?
        `;

        values = [status, requestId];

    }

    else{

        sql = `
        UPDATE pickup_requests
        SET status = ?
        WHERE request_id = ?
        `;

        values = [status, requestId];

    }

    db.query(sql, values, (err, result) => {

        if(err){

            console.log(err);

            return res.status(500).json({
                message: "Database Error"
            });

        }

        res.json({
            message: `Request ${status} successfully`
        });

    });

});
app.get('/available-food', (req, res) => {

    const sql = `
        SELECT * FROM food_listings
        WHERE status = 'available'
    `;

    db.query(sql, (err, result) => {

        if(err){
            console.log(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(result);

    });

});
app.get('/pickup-requests', (req, res) => {

    const sql = `
    SELECT 
        pr.request_id,
        fl.food_name,
        fl.quantity,
        u.name AS volunteer_name,
        pr.status,
        pr.request_time,
        pr.pickup_time
    FROM pickup_requests pr

    JOIN food_listings fl
    ON pr.food_id = fl.food_id

    JOIN volunteers v
    ON pr.volunteer_id = v.volunteer_id

    JOIN users u
    ON v.user_id = u.user_id
    `;

    db.query(sql, (err, result) => {

        if(err){
            console.log(err);

            return res.status(500).json({
                message: "Database Error"
            });
        }

        res.json(result);

    });

});

// START SERVER (ONLY ONCE)
app.listen(3000, () => {
    console.log("Server running on port 3000");
});