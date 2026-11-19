-- Migración segura sobre una base freelink_db EXISTENTE (no elimina tablas).
-- Ejecutar UNA SOLA VEZ en MySQL Workbench. Para instalaciones nuevas usar freelink_db.sql.
USE freelink_db;
CREATE TABLE IF NOT EXISTS COMENTARIOS (
 id_comentario INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK autogenerada',
 id_publicacion INT NOT NULL COMMENT 'FK publicación',
 id_usuario INT NOT NULL COMMENT 'FK autor',
 contenido VARCHAR(300) NOT NULL COMMENT 'Texto 1-300 caracteres',
 fecha_comentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de comentario',
 CONSTRAINT fk_comentarios_publicacion FOREIGN KEY(id_publicacion) REFERENCES PUBLICACIONES(id_publicacion) ON DELETE CASCADE,
 CONSTRAINT fk_comentarios_usuario FOREIGN KEY(id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS VALORACIONES (
 id_publicacion INT NOT NULL COMMENT 'PK y FK a PUBLICACIONES',
 id_usuario INT NOT NULL COMMENT 'PK y FK a USUARIOS',
 estrellas TINYINT UNSIGNED NOT NULL COMMENT 'Entero 1 a 5',
 fecha_valoracion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha del último voto',
 PRIMARY KEY(id_publicacion,id_usuario),
 CONSTRAINT chk_valoracion_estrellas CHECK(estrellas BETWEEN 1 AND 5),
 CONSTRAINT fk_valoracion_publicacion FOREIGN KEY(id_publicacion) REFERENCES PUBLICACIONES(id_publicacion) ON DELETE CASCADE,
 CONSTRAINT fk_valoracion_usuario FOREIGN KEY(id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
);
DROP PROCEDURE IF EXISTS sp_listar_feed;
DROP PROCEDURE IF EXISTS sp_listar_comentarios;
DROP PROCEDURE IF EXISTS sp_crear_comentario;
DROP PROCEDURE IF EXISTS sp_valorar_publicacion;
DELIMITER //
CREATE PROCEDURE sp_listar_feed(IN p_usuario INT)
BEGIN
 SELECT p.id_publicacion,p.id_usuario,u.nombre,p.id_categoria,c.nombre AS categoria,
 p.tipo_contenido,p.contenido,p.nombre_archivo,p.mime_type,p.fecha_publicacion,
 (p.multimedia IS NOT NULL AND OCTET_LENGTH(p.multimedia)>0) AS tiene_multimedia,
 (SELECT COUNT(co.id_comentario) FROM COMENTARIOS co WHERE co.id_publicacion=p.id_publicacion) AS total_comentarios,
 (SELECT ROUND(AVG(v.estrellas),1) FROM VALORACIONES v WHERE v.id_publicacion=p.id_publicacion) AS promedio_estrellas,
 (SELECT COUNT(v.estrellas) FROM VALORACIONES v WHERE v.id_publicacion=p.id_publicacion) AS total_valoraciones,
 (SELECT v.estrellas FROM VALORACIONES v WHERE v.id_publicacion=p.id_publicacion AND v.id_usuario=p_usuario) AS mis_estrellas
 FROM PUBLICACIONES p JOIN USUARIOS u ON u.id_usuario=p.id_usuario
 JOIN CATEGORIAS c ON c.id_categoria=p.id_categoria WHERE p.estado='activo'
 ORDER BY p.fecha_publicacion DESC,p.id_publicacion DESC;
END//
CREATE PROCEDURE sp_listar_comentarios(IN p_publicacion INT)
BEGIN
 SELECT co.id_comentario,co.id_usuario,u.nombre AS autor,co.contenido,co.fecha_comentario
 FROM COMENTARIOS co JOIN USUARIOS u ON u.id_usuario=co.id_usuario
 WHERE co.id_publicacion=p_publicacion ORDER BY co.fecha_comentario,co.id_comentario;
END//
CREATE PROCEDURE sp_crear_comentario(IN p_publicacion INT,IN p_usuario INT,IN p_contenido VARCHAR(300))
BEGIN
 IF CHAR_LENGTH(TRIM(p_contenido)) NOT BETWEEN 1 AND 300 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Comentario inválido';
 END IF;
 INSERT INTO COMENTARIOS(id_publicacion,id_usuario,contenido) VALUES(p_publicacion,p_usuario,TRIM(p_contenido));
END//
CREATE PROCEDURE sp_valorar_publicacion(IN p_publicacion INT,IN p_usuario INT,IN p_estrellas INT)
BEGIN
 IF p_estrellas NOT BETWEEN 1 AND 5 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La puntuación debe ser de 1 a 5';
 END IF;
 INSERT INTO VALORACIONES(id_publicacion,id_usuario,estrellas) VALUES(p_publicacion,p_usuario,p_estrellas)
 ON DUPLICATE KEY UPDATE estrellas=VALUES(estrellas);
END//
DELIMITER ;
