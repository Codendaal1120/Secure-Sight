cd /d %~dp0\web
@REM npm run build
xcopy /E /S /Y "%~dp0\web\.next\" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\web\.next"
xcopy /Y "%~dp0\web\.env.prod" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\web\.env.prod"
xcopy /Y "%~dp0\web\next.config.js" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\web\next.config.js"
xcopy /Y "%~dp0\web\package.json" "E:\Development\BSC\Sem7\CM3070-Final Project\.SecureSight-deploy\web\package.json"
pause