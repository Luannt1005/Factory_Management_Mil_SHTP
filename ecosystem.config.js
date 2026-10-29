
module.exports = {
    apps: [
        {
            name: "orgchart",
            script: ".next/standalone/server.js",
            cwd: "C:/Users/idmcauto.svc/Desktop/Orgchart_TTI_onprem",
            env: {
                NODE_ENV: "production",
                NODE_OPTIONS: "--max-http-header-size=65536",
                PORT: "3000",
                HOSTNAME: "0.0.0.0"
            },
            autorestart: true,
            watch: false,
            max_memory_restart: "1G"
        }
    ]
};
