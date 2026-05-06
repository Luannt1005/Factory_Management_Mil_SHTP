require('dotenv').config({
    path: require('path').resolve(__dirname, '.env.local')
});

console.log("CLIENT_ID:", process.env.AZURE_AD_CLIENT_ID);

require('./.next/standalone/server.js');