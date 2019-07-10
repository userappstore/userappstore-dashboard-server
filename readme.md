# UserAppStore dashboard server

This is the configured [app store dashboard server](https://github.com/userappstore/app-store-dashboard-server) for [userappstore.com](https://userappstore.com).

You should work with the [app store dashboard server](https://github.com/userappstore/app-store-application-server) software and configure it to your needs.  

This repository contains the configuration and contains:

- src/www/account/register.html to override the [Dashboard](https://github.com/userdashboard/dashboard) registration page
- src/www/index.html the guest landing page

     $ npm init
     $ npm install @userappstore/app-store-dashboard-server
     $ npm install @userdashboard/storage-redis
     # optionally override registration page
     # create your index.html
     # create your main.js
     $ node main.js

     # main.js
     const server = require('@userdashboard/dashboard')
     server.start(__dirname)
