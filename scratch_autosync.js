const { Client } = require('./node_modules/pg'); 
require('dotenv').config({ path: '.env.local' }); 

async function run() { 
    // Connect to Orgchart_TTI_Mil (SSO accounts)
    const clientSSO = new Client({ 
        host: process.env.DB_SERVER, 
        port: process.env.DB_PORT, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DB_NAME // Orgchart_TTI_Mil
    }); 
    await clientSSO.connect(); 
    
    // Connect to Visitor_database
    const clientVis = new Client({ 
        host: process.env.DB_SERVER, 
        port: process.env.DB_PORT, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: 'Visitor_database'
    }); 
    await clientVis.connect(); 

    // Fetch all users with department IS NULL in Visitor_database
    const visUsers = await clientVis.query(`SELECT id, email, name FROM "User" WHERE department IS NULL`);
    console.log(`Found ${visUsers.rowCount} users with NULL department in Visitor_database`);

    let updatedCount = 0;

    for (const visUser of visUsers.rows) {
        if (!visUser.email) continue;
        
        // Find by email in SSO users
        const ssoRes = await clientSSO.query(`SELECT department FROM users WHERE email = $1 LIMIT 1`, [visUser.email]);
        
        let newDept = null;
        if (ssoRes.rowCount > 0 && ssoRes.rows[0].department) {
            newDept = ssoRes.rows[0].department;
        }

        if (newDept) {
            await clientVis.query(`UPDATE "User" SET department = $1 WHERE id = $2`, [newDept, visUser.id]);
            updatedCount++;
            console.log(`Mapped ${visUser.email} -> ${newDept}`);
        }
    }

    console.log(`Updated ${updatedCount} users with mapped departments.`);

    await clientSSO.end(); 
    await clientVis.end(); 
} 
run().catch(console.error);
