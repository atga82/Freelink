# Auditoría FreeLink — rúbrica BD Multimedia (19 noviembre 2026)

## Tablas y uso real del backend
| Tabla | Estado | Evidencia |
|---|---|---|
| USUARIOS | En uso | login, registro, perfil, foto |
| CATEGORIAS | En uso | crear publicación, feed |
| PUBLICACIONES | En uso | crear, listar, multimedia |
| USUARIO_INTERESES | En uso | registro y consulta de perfil |
| PRODUCTOS | Sin operaciones PHP persistentes | marketplace es prototipo visual |
| SERVICIOS | Sin operaciones PHP persistentes | detalle de servicio es estático |
| MENSAJES | Sin operaciones PHP persistentes | interfaz mensajes sin persistencia |
| COMENTARIOS | Nueva tabla, integrada al feed | interacciones.php y guardar_interaccion.php |
| VALORACIONES | Nueva tabla, integrada al feed | 1 voto por usuario/publicación; promedio |

No borrar PRODUCTOS, SERVICIOS ni MENSAJES antes de decidir si formarán parte de las cuatro funcionalidades adicionales. 'Sin uso' significa sin operaciones de BD identificadas en el código PHP, no que no haya pantallas diseñadas.

## Cambios
- freelink_db.sql: diccionario de datos con COMMENT para cada columna mediante ALTER TABLE, dos tablas nuevas y cuatro procedimientos almacenados.
- freelink_migracion_interacciones.sql: migración sin DROP DATABASE para una BD ya instalada.
- php/interacciones.php: consulta comentarios persistentes.
- php/guardar_interaccion.php: escribe comentarios y estrellas usando SP y sesión.
- php/obtener_feed.php: usa SP para traer totales de comentarios y valoraciones.
- js/feed.js y css/feed.css: interfaz y carga/guardado de interacciones.

## Rúbrica: evaluación honesta
| Criterio | Estado observado |
|---|---|
| Página inicial, publicaciones y usuarios | Existe implementación; falta prueba completa en navegador |
| Contraseña | Se exige mínimo 8 caracteres y se guarda hash; revisar reglas más fuertes |
| Multimedia BLOB para imágenes | Implementado con MEDIUMBLOB/LONGBLOB |
| Reportes con filtros y SP | Pendiente |
| Cuatro funcionalidades adicionales completas | No demostradas; marketplace, mensajes y seguimiento son prototipos |
| MVC y POO PHP | Pendiente: endpoints procedurales, conexión mysqli no encapsulada |
| Todas las operaciones mediante SP | Pendiente: numerosas consultas SQL directas |
| Prohibición SELECT * | No detectado en los archivos PHP revisados |
| Mínimo 2 triggers, 8 views, 2 functions | Pendiente: el script no contiene esos objetos |
| Diagrama relacional MySQL | Pendiente generar/verificar archivo entregable |
| Diccionario atributos/descripciones/dominio/restricciones | Agregado a SQL mediante comentarios; revisar dominios más estrictos |
| Documentación Word de BD y de operación | Pendiente verificar entregables externos |
| Validaciones, mensajes, CRUD integral | Parcial |
| Reporte de resultados | Pendiente |
| Clase PHP de conexión | No hay clase; conexion.php es procedural |
| Hosting | Opcional |

## Instalación y precauciones
1. **No ejecutar freelink_db.sql sobre una BD con datos reales:** empieza con DROP DATABASE IF EXISTS freelink_db y borraría todo.
2. Para una BD ya existente, abrir freelink_migracion_interacciones.sql en MySQL Workbench y ejecutar con una copia de seguridad previa. Esto incorpora tablas y SP sin eliminar usuarios/publicaciones.
3. Servir el proyecto con Apache/PHP y MySQL. Probar crear un comentario, recargar y verificar persistencia; valorar 5 estrellas, recargar, cambiar a 3 y revisar promedio.
4. La migración de interacciones no añade los COMMENT a las columnas originales. Para entrega en limpio, el diccionario completo está en freelink_db.sql.
5. El código no fue sometido a prueba extremo a extremo con MySQL activo; solo se verificó la sintaxis PHP y JS.
6. Revisar y sacar del repositorio cualquier contraseña de desarrollo: conexion.php contiene parámetros locales incrustados.
