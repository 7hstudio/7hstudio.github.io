@echo off
title 7H STUDIOS - DISCORD BOT RUNNER
color 0B
cls

echo ========================================================
echo        7H STUDIOS - DISCORD BOT LAUNCHER
echo ========================================================
echo.
echo [*] Navigation vers le dossier discord-bot...
cd /d "C:\Users\Administrator\.gemini\antigravity-ide\scratch\discord-bot"

echo [*] Configuration environnement Node.js...
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo [*] Lancement de 7H BOT...
echo [*] Pour quitter : fermez cette fenetre ou tapez Ctrl+C
echo ========================================================
echo.

:loop
"C:\Users\Administrator\nodejs\node.exe" index.js
echo.
echo [!] Le bot s'est deconnecte ou arrete.
echo [!] Redemarrage automatique dans 5 secondes...
timeout /t 5 >nul
echo [*] Relance du bot...
goto loop
