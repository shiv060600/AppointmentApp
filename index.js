const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const db = require("./database.js")
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Appointment Scheduler API');
  });

//check availability
app.get("/availability", async (req,res) =>{
    const {date,serviceId,companyId} = req.query;
    if (!date || !serviceId || companyId){
        return res.status(400).json({error: "Date, ServiceId, and CompanyId are required"})
    }
    try {
        const result = await db.query(
            'SELECT * FROM service_slots WHERE date = $1 AND service_id =$2 AND company_id = $3 AND is_available = TRUE',
            [date, serviceId,companyId]
        );
        const availableSlots = result.rows.map((row) => row.slot_time);
        res.json({availableSlots})
    } catch (err) {
        return res.status(500).json({error:"Database Error" , details : err.message })
    }

})
//book  appointment
app.post("/appointments", async (req,res)=>{
    const {date,time,serviceId,customerName,customerPhone,customerEmail,notes,companyId} = req.body;
    if (!date || !time || !serviceId || !customerName || !customerPhone){
        return res.status(400).json({error : "All fields are required"})
    }
    try{
        //customer handling
        let customerResult = await db.query("SELECT customer_id FROM customers WHERE customer_name = $1 AND phone_number = $2 AND email = $3",
            [customerName,customerPhone,customerEmail]
        );
        let customerId; 
        if (customerResult.rows.length > 0){
            customerId = customerResult.rows[0].customer_id;
        }else{
            //Customer is not in customer tables and needs to be created
            customerResult = await db.query("INSERT INTO customers (customer_name,phone_number,email) VALUES ($1,$2,$3) RETURNING customer_id",
                [customerName,customerPhone,customerEmail]
            );
            customerId = customerResult.rows[0].customer_id;
        }
        //service slot
        const availabilityResult = await db.query("SELECT slot_id FROM service_slots WHERE company_id = $1 AND service_id = $2 AND slot_date = $3 AND slot_time = $4 AND is_available = TRUE'",
            [companyId,serviceId,date,time]
        );
        if (availabilityResult.rows.length === 0 ){
            return res.status(409).json({error: "No Slots avaiable for time specified"})
        }
        const slotId = availabilityResult.rows[0].slot_id;
        //make the selected slot unavailable
        await db.query("UPDATE service_slots SET is_available = FALSE WHERE slot_id = $1",[slotId])

        // Appointment Creation
        const appointmentResult = await db.query(
            "INSERT INTO appointments (customer_id, slot_id, appointment_date, appointment_time, notes) VALUES ($1, $2, $3, $4, $5) RETURNING appointment_id",
            [customerId, slotId, date, time, notes]
        );

        const appointmentId = appointmentResult.rows[0].appointment_id;

        // Send Response
        res.json({ appointmentId: appointmentId });


        
    }catch (err){
        return res.status(500).json({error:"Database Error", details : err.message})

    }
})
//cancel appointment
app.delete("/appointments/:id", async (req,res)=>{
    const appointmentId = req.params.id
    if (!appointmentId){
        return res.status(400).json({ error : "Appointment Id Required"})
    }
    try {
        const appointment = await db.query("SELECT slot_id FROM appointments WHERE appointment_id = $1", [appointmentId])
        if (appointment.rows.length === 0){
            return res.status(404).json({ error: "Appointment not found" });
        }
        // Set service slot to available
        await db.query('UPDATE service_slots SET is_available = TRUE WHERE slot_id = $1', [appointment.rows[0].slot_id]);

        // Delete appointment
        await db.query('UPDATE appointments SET is_canceled = true WHERE appointment_id = $1', [appointmentId]);

        res.json({ message: "Appointment canceled" });

    }catch(err){
        return res.status(500).json({err : "Database Error"})

    }
    res.send("Cancel Appointment")
})

//gett appointment details
app.get("/appointment/:id", async (req,res)=>{
    const appointmentId = req.params.id
    if (!appointmentId){
        return res.status(400).json({error : "Appointment not found"})
    }
    try{
        const appointmentResult = await db.query("SELECT appointments.*, customers.customer_name, customers.phone_number, customers.email, service_slots.slot_date, service_slots.slot_time FROM appointments JOIN customers ON appointments.customer_id = customers.customer_id JOIN service_slots ON appointments.slot_id = service_slots.slot_id WHERE appointments.appointment_id = $1",
            [appointmentId]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({error : "appointment not found"});
        }
        res.json({ details : appointmentResult.rows[0]});

    }catch(err){
        res.status(500).json({err: "DB error"})
    }
    res.send(`Get Appointment Details for appointment : ${appointmentId}`)
})

  
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });