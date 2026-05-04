# Guía de Desarrollo y Lanzamiento (Windows & Linux)

Este documento detalla el flujo de trabajo para asegurar que la aplicación funcione correctamente en ambos sistemas operativos y que los usuarios finales solo reciban versiones estables y probadas.

## 1. Ciclo de Desarrollo Diario
- **Rama Única**: Trabaja siempre sobre la rama `main` (o ramas de características que luego unas a `main`).
- **Código Agnóstico**: 
    - Usa siempre `path.join()` para rutas de archivos.
    - Si necesitas lógica específica por sistema:
      ```javascript
      if (process.platform === 'win32') { /* Windows */ }
      else { /* Linux/macOS */ }
      ```

## 2. Verificación Automática (CI)
Cada vez que haces un `git push` a `main`:
1. GitHub Actions activará el flujo **"Continuous Integration"**.
2. Se validará la sintaxis del código.
3. Se compilará la aplicación para Linux y Windows en la nube.

## 3. Cómo probar antes de lanzar (Beta Privada)
Para evitar enviar errores a los usuarios finales:
1. Ve a tu repositorio en GitHub.com y haz clic en la pestaña **Actions** que se encuentra en el menú superior (al lado de "Code", "Issues", "Pull requests").
2. Selecciona la ejecución más reciente del flujo de CI.
3. Al final de la página, en **Artifacts**, descarga el archivo `PresalesApp-windows-latest` o `PresalesApp-ubuntu-latest`.
4. Instala y prueba el `.exe` o `.AppImage` localmente.
5. **Los usuarios finales NO recibirán notificaciones** de estos archivos, ya que no son un lanzamiento oficial.

## 4. Lanzamiento Oficial (Publicación)
Solo cuando hayas probado los artefactos del paso anterior y estés 100% seguro:
1. Asegúrate de actualizar la versión en `package.json` (ej: `2.2.1`).
2. Crea una etiqueta (tag) en Git y súbela:
   ```bash
   git tag v2.2.1
   git push origin v2.2.1
   ```
3. Esto activará el flujo **"Build and Release"**, que publicará la versión en la sección "Releases" de GitHub.
4. **En este momento**, los usuarios finales recibirán la notificación de "Actualización Disponible".

## 5. Mantenimiento del Control
- Si un "Check" de GitHub sale en **Rojo (X)**: Revisa los logs. Significa que el código rompió la compilación en uno de los dos sistemas. No ignores estas alertas.
- No uses ramas separadas para Windows y Linux; el CI se encarga de verificar ambos sistemas simultáneamente sobre el mismo código.
