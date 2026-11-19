-- FreeLink: dos funciones de consulta para métricas de publicaciones
-- Ejecutar después de crear las tablas. No modifica datos.
USE freelink_db;
DELIMITER $$
DROP FUNCTION IF EXISTS fn_promedio_estrellas$$
CREATE FUNCTION fn_promedio_estrellas(p_id_publicacion INT)
RETURNS DECIMAL(3,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_promedio DECIMAL(3,2) DEFAULT 0.00;
    SELECT COALESCE(ROUND(AVG(v.estrellas), 2), 0.00)
      INTO v_promedio
      FROM VALORACIONES AS v
     WHERE v.id_publicacion = p_id_publicacion;
    RETURN v_promedio;
END$$

DROP FUNCTION IF EXISTS fn_total_comentarios$$
CREATE FUNCTION fn_total_comentarios(p_id_publicacion INT)
RETURNS INT UNSIGNED
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT UNSIGNED DEFAULT 0;
    SELECT COUNT(c.id_comentario)
      INTO v_total
      FROM COMENTARIOS AS c
     WHERE c.id_publicacion = p_id_publicacion;
    RETURN v_total;
END$$
DELIMITER ;
