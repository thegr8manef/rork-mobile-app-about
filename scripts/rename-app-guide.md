# Rename everything
node scripts/rename-app.js --name "NewApp" --bundle-id com.company.newapp --package com.company.newapp

# Only change bundle ID and package name
node scripts/rename-app.js -b com.attijari.newbundle -p com.attijari.newbundle

# Only rename the display name
node scripts/rename-app.js -n "Attijari Mobile"

# See help
node scripts/rename-app.js --help