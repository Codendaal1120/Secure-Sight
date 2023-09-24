xcopy /Y "%~dp0\server\server.js" "%~dp0\server\.build\"
xcopy /Y "%~dp0\.env.production" "%~dp0\server\.build\"
xcopy /Y "%~dp0\server\package.json" "%~dp0\server\.build\"
xcopy /E /S /Y "%~dp0\server\app\controllers" "%~dp0\server\.build\app\controllers\"
xcopy /E /S /Y "%~dp0\server\app\modules" "%~dp0\server\.build\app\modules\"
xcopy /E /S /Y "%~dp0\server\app\services" "%~dp0\server\.build\app\services\"
cd /d %~dp0\server
set /p build=< build.txt
set /A build = build + 1
echo %build% > build.txt
xcopy /Y "build.txt" "%~dp0\server\.build"
echo BUILD %build%
pause