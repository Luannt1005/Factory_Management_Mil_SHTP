module.exports = {
    apps: [
        {
            name: "orgchart",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3000 --hostname 0.0.0.0",
            cwd: "./",
            env: {
                NODE_ENV: "production",
                NODE_OPTIONS: "--max-http-header-size=65536"
            },
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        }
    ]
}