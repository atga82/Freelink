-- FreeLink: ocho vistas de consulta y reportes sin exponer campos BLOB ni contraseñas
-- Ejecutar después de freelink_funciones.sql.
USE freelink_db;
DELIMITER $$
CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_publicaciones_feed AS
SELECT p.id_publicacion, p.id_usuario, u.nombre AS autor,
       p.id_categoria, c.nombre AS categoria, p.tipo_contenido,
       p.contenido, p.fecha_publicacion,
       fn_total_comentarios(p.id_publicacion) AS total_comentarios,
       fn_promedio_estrellas(p.id_publicacion) AS promedio_estrellas,
       (SELECT COUNT(v.id_usuario) FROM VALORACIONES v
         WHERE v.id_publicacion=p.id_publicacion) AS total_valoraciones,
       (p.multimedia IS NOT NULL AND OCTET_LENGTH(p.multimedia)>0) AS tiene_multimedia
FROM PUBLICACIONES p
JOIN USUARIOS u ON u.id_usuario=p.id_usuario
JOIN CATEGORIAS c ON c.id_categoria=p.id_categoria
WHERE p.estado='activo' AND u.estado='activo'$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_comentarios_detalle AS
SELECT cm.id_comentario, cm.id_publicacion, cm.id_usuario,
       u.nombre AS autor_comentario, p.id_usuario AS autor_publicacion,
       cm.contenido, cm.fecha_comentario
FROM COMENTARIOS cm
JOIN USUARIOS u ON u.id_usuario=cm.id_usuario
JOIN PUBLICACIONES p ON p.id_publicacion=cm.id_publicacion$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_valoraciones_detalle AS
SELECT v.id_publicacion, v.id_usuario, u.nombre AS usuario_valorador,
       p.id_usuario AS autor_publicacion, v.estrellas, v.fecha_valoracion
FROM VALORACIONES v
JOIN USUARIOS u ON u.id_usuario=v.id_usuario
JOIN PUBLICACIONES p ON p.id_publicacion=v.id_publicacion$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_estadisticas_usuarios AS
SELECT u.id_usuario,u.nombre,u.tipo_usuario,u.fecha_registro,u.estado,
       (SELECT COUNT(p.id_publicacion) FROM PUBLICACIONES p
         WHERE p.id_usuario=u.id_usuario) AS publicaciones_creadas,
       (SELECT COUNT(cm.id_comentario) FROM COMENTARIOS cm
         WHERE cm.id_usuario=u.id_usuario) AS comentarios_realizados,
       (SELECT COUNT(v.id_publicacion) FROM VALORACIONES v
         WHERE v.id_usuario=u.id_usuario) AS valoraciones_emitidas,
       (SELECT COUNT(i.interes) FROM USUARIO_INTERESES i
         WHERE i.id_usuario=u.id_usuario) AS intereses_seleccionados
FROM USUARIOS u$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_resumen_categorias AS
SELECT c.id_categoria,c.nombre,c.descripcion,
       (SELECT COUNT(p.id_publicacion) FROM PUBLICACIONES p
         WHERE p.id_categoria=c.id_categoria AND p.estado='activo') AS publicaciones_activas,
       (SELECT COUNT(pr.id_producto) FROM PRODUCTOS pr
         WHERE pr.id_categoria=c.id_categoria AND pr.estado='disponible') AS productos_disponibles,
       (SELECT COUNT(s.id_servicio) FROM SERVICIOS s
         WHERE s.id_categoria=c.id_categoria AND s.estado='activo') AS servicios_activos
FROM CATEGORIAS c$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_productos_disponibles AS
SELECT pr.id_producto,pr.id_usuario,u.nombre AS vendedor,
       pr.id_categoria,c.nombre AS categoria,pr.nombre AS producto,
       pr.precio,pr.stock,pr.estado
FROM PRODUCTOS pr
JOIN USUARIOS u ON u.id_usuario=pr.id_usuario
JOIN CATEGORIAS c ON c.id_categoria=pr.id_categoria
WHERE pr.estado='disponible' AND u.estado='activo'$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_servicios_activos AS
SELECT s.id_servicio,s.id_usuario,u.nombre AS proveedor,
       s.id_categoria,c.nombre AS categoria,s.nombre AS servicio,
       s.precio_base,s.estado
FROM SERVICIOS s
JOIN USUARIOS u ON u.id_usuario=s.id_usuario
JOIN CATEGORIAS c ON c.id_categoria=s.id_categoria
WHERE s.estado='activo' AND u.estado='activo'$$

CREATE OR REPLACE SQL SECURITY INVOKER VIEW vw_resumen_mensajeria AS
SELECT u.id_usuario,u.nombre,u.estado,
       (SELECT COUNT(m.id_mensaje) FROM MENSAJES m
         WHERE m.id_emisor=u.id_usuario) AS mensajes_enviados,
       (SELECT COUNT(m.id_mensaje) FROM MENSAJES m
         WHERE m.id_receptor=u.id_usuario) AS mensajes_recibidos,
       (SELECT COUNT(m.id_mensaje) FROM MENSAJES m
         WHERE m.id_receptor=u.id_usuario AND m.leido=FALSE) AS mensajes_sin_leer
FROM USUARIOS u$$
DELIMITER ;
