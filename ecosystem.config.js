module.exports = {
    apps: [
        {
            name: "rockyrabbit-bot",
            script: "./build/app.js",
            watch: false,
            error_file: "./logs/errors.log",
            out_file: "./logs/out.log",
            autorestart: true,
            log_date_format: "YYYY-MM-DD HH:mm Z"
        }
    ]
}
