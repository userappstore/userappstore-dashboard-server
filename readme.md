# UserAppStore dashboard server
This is the configured [app store dashboard server](https://github.com/userappstore/app-store-dashboard-server) for [userappstore.com](https://userappstore.com).

You should work with the [app store dashboard server](https://github.com/userappstore/app-store-application-server) rather than this repository:

     $ npm init
     $ npm install @userappstore/app-store-dashboard-server
     $ npm install @userdashboard/storage-redis
     $ node main.js

    # main.js
    const server = require('@userdashboard/dashboard')
    server.start(__dirname)
