const jwt = require('jsonwebtoken');

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
const secret = "sOS5fu3pJ8wwBEckQdQai/uxgo88G/b8wZ9g6KBnkig=";

try {
    const decoded = jwt.verify(anonKey, secret);
    console.log("✅ Anon Key Verified with Secret!");

    // Generate Service Role Key
    const payload = {
        role: "service_role",
        iss: "supabase-demo",
        iat: 1641769200,
        exp: 2000000000 // Long expiry
    };

    const serviceKey = jwt.sign(payload, secret);
    console.log("🔑 Generated Service Key:", serviceKey);
} catch (e) {
    console.error("❌ Verification Failed:", e.message);

    // Check if secret needs decoding (base64)?
    // Note: Supabase secrets in env are usually plain strings but sometimes base64?
    // Let's try treating it as a string first (standard for 'jsonwebtoken' library unless buffer passed)
}
