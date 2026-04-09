module.exports = {
    apps: [
        {
            name: "orgchart",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3000 --hostname 0.0.0.0",
            cwd: "c:/Users/idmcauto.svc/Desktop/Orgchart_TTI_onprem",
            env: {
                NODE_ENV: "production"
            },
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        }
    ]
}