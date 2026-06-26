@echo off
title Reset Event Registration Node.js App

echo =============================================
echo Resetting Event Registration Project
echo =============================================

if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

if exist events.db (
    echo Removing database events.db...
    del events.db
)

echo Reinstalling packages...
npm install

echo.
echo Reset complete.
echo Now run run.bat
echo.

pause
