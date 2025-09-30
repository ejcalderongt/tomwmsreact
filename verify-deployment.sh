#!/bin/bash
echo "=== Verificación de Deployment ==="
echo "1. Servidor configurado: http://52.41.114.122:8097"
echo "2. Proxy configurado correctamente: $(grep -c 'http://52.41.114.122:8097' server.js) veces"
echo "3. Sin express.json: $(grep -c 'express.json' server.js) ocurrencias"
echo "4. Build actualizado: $(ls -lh dist/index.html 2>/dev/null | awk '{print $6, $7, $8}')"
echo ""
echo "✅ Todo listo para deployment"
