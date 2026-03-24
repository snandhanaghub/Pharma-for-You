@echo off
REM Quick test script for Windows CMD

echo =================================
echo ^10h Pharma4u API Quick Test
echo =================================
echo.
echo Testing FastAPI health endpoint...

curl http://127.0.0.1:8000/api/health
echo.
echo.
echo If you see {"status":"healthy"} above, backend is working!
echo.
exit /b 0
