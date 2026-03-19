"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.log(process.env.SUPABASE_URL);
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
exports.default = supabase;
