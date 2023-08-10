xcopy /Y "%~dp0\server\server.js" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\"
xcopy /Y "%~dp0\.env.production" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\"
xcopy /Y "%~dp0\server\package.json" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\"
xcopy /E /S /Y "%~dp0\server\app\controllers" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\app\controllers\"
xcopy /E /S /Y "%~dp0\server\app\modules" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\app\modules\"
xcopy /E /S /Y "%~dp0\server\app\services" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server\app\services\"
cd /d %~dp0
set /p build=< build.txt
set /A build = build + 1
echo %build% > build.txt
xcopy /Y "%~dp0\build.txt" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\server"
echo BUILD %build%
pause