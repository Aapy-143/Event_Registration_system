@echo off
title Event Registration Node.js App

echo =============================================
echo Event Registration Node.js App
echo =============================================

if not exist node_modules (
    echo Installing packages...
    npm install
)

echo Starting server...
echo.
echo Open this in browser:
echo http://localhost:3000
echo.

npm start

pause
