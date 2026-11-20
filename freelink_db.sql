
-- ============================================
-- FREELINK
-- SCRIPT DE INSTALACION DE BASE DE DATOS
-- ============================================

DROP DATABASE IF EXISTS freelink_db;

CREATE DATABASE freelink_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE freelink_db;

CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM(
        'vendedor_cliente',
        'cliente'
    ) NOT NULL DEFAULT 'cliente',
    foto_perfil MEDIUMBLOB,
    biografia TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'activo'
);

CREATE TABLE CATEGORIAS (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE PUBLICACIONES (
    id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    tipo_contenido ENUM(
        'texto',
        'imagen',
        'video',
        'mixto'
    ) NOT NULL,
    contenido TEXT,
    nombre_archivo VARCHAR(255) NULL,
    multimedia LONGBLOB,
    mime_type VARCHAR(100),
    tamano_bytes BIGINT UNSIGNED NULL,
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'activo',

    CONSTRAINT fk_pub_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_pub_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES CATEGORIAS(id_categoria)
        ON DELETE CASCADE
);

CREATE TABLE PRODUCTOS (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'disponible',

    CONSTRAINT fk_prod_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_prod_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES CATEGORIAS(id_categoria)
        ON DELETE CASCADE
);

CREATE TABLE SERVICIOS (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',

    CONSTRAINT fk_serv_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_serv_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES CATEGORIAS(id_categoria)
        ON DELETE CASCADE
);

CREATE TABLE MENSAJES (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_emisor INT NOT NULL,
    id_receptor INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_msg_emisor
        FOREIGN KEY (id_emisor)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_msg_receptor
        FOREIGN KEY (id_receptor)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE USUARIO_INTERESES (
    id_usuario INT NOT NULL,
    interes VARCHAR(30) NOT NULL,

    PRIMARY KEY (id_usuario, interes),

    CONSTRAINT fk_intereses_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
);

INSERT INTO CATEGORIAS (
    id_categoria,
    nombre,
    descripcion
)
VALUES
(
    1,
    'Diseño',
    'Diseño gráfico, interfaces y diseño digital.'
),
(
    2,
    'Programación',
    'Desarrollo de software y programación.'
),
(
    3,
    'Fotografía',
    'Fotografía y edición de imágenes.'
),
(
    4,
    'Video',
    'Creación, edición y producción audiovisual.'
),
(
    6,
    'Artesanías',
    'Creación de productos y objetos hechos a mano.'
),
(
    7,
    'Música',
    'Composición, interpretación y producción musical.'
),
(
    8,
    'Educación',
    'Enseñanza, aprendizaje y contenido educativo.'
),
(
    9,
    'Creadores',
    'Contenido creativo y proyectos digitales.'
);

DELIMITER //

DROP PROCEDURE IF EXISTS sp_registrar_usuario//

CREATE PROCEDURE sp_registrar_usuario(
    IN p_nombre VARCHAR(100),
    IN p_correo VARCHAR(150),
    IN p_password_hash VARCHAR(255),
    IN p_tipo_usuario VARCHAR(30),
    IN p_biografia TEXT
)
BEGIN

    IF p_tipo_usuario NOT IN (
        'vendedor_cliente',
        'cliente'
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tipo de usuario no válido.';

    ELSEIF EXISTS (
        SELECT 1
        FROM USUARIOS
        WHERE correo = p_correo
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El correo electrónico ya se encuentra registrado.';

    ELSE

        INSERT INTO USUARIOS (
            nombre,
            correo,
            password_hash,
            tipo_usuario,
            biografia,
            fecha_registro,
            estado
        )
        VALUES (
            p_nombre,
            p_correo,
            p_password_hash,
            p_tipo_usuario,
            p_biografia,
            NOW(),
            'activo'
        );

    END IF;

END //


DROP PROCEDURE IF EXISTS sp_actualizar_usuario//

CREATE PROCEDURE sp_actualizar_usuario(
    IN p_id_usuario INT,
    IN p_nombre VARCHAR(100),
    IN p_correo VARCHAR(150),
    IN p_biografia TEXT,
    IN p_estado VARCHAR(50)
)
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM USUARIOS
        WHERE id_usuario = p_id_usuario
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario especificado no existe.';

    ELSE

        UPDATE USUARIOS
        SET
            nombre = p_nombre,
            correo = p_correo,
            biografia = p_biografia,
            estado = p_estado
        WHERE id_usuario = p_id_usuario;

    END IF;

END //


DROP PROCEDURE IF EXISTS sp_consultar_usuario//

CREATE PROCEDURE sp_consultar_usuario(
    IN p_id_usuario INT
)
BEGIN

    SELECT
        id_usuario,
        nombre,
        correo,
        biografia,
        fecha_registro,
        estado
    FROM USUARIOS
    WHERE id_usuario = p_id_usuario;

END //

DELIMITER ;







-- DICCIONARIO DE DATOS: cada COMMENT describe propósito, dominio y restricciones.
-- Las tablas PRODUCTOS, SERVICIOS y MENSAJES se mantienen para desarrollo futuro;
-- todavía no tienen operaciones PHP persistentes en esta versión.
ALTER TABLE USUARIOS
 MODIFY id_usuario INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY nombre VARCHAR(100) NOT NULL COMMENT 'Nombre visible; 1 a 100 caracteres, obligatorio',
 MODIFY correo VARCHAR(150) NOT NULL COMMENT 'Correo único y obligatorio; formato email validado en aplicación',
 MODIFY password_hash VARCHAR(255) NOT NULL COMMENT 'Hash de contraseña generado con password_hash; nunca texto plano',
 MODIFY tipo_usuario ENUM('vendedor_cliente','cliente') NOT NULL DEFAULT 'cliente' COMMENT 'Rol; dominio vendedor_cliente o cliente',
 MODIFY foto_perfil MEDIUMBLOB NULL COMMENT 'Fotografía binaria opcional; imagen JPEG PNG o WebP',
 MODIFY biografia TEXT NULL COMMENT 'Descripción del usuario; texto libre opcional',
 MODIFY fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de alta; valor automático',
 MODIFY estado VARCHAR(50) DEFAULT 'activo' COMMENT 'Estado lógico de cuenta; actualmente activo';
ALTER TABLE CATEGORIAS
 MODIFY id_categoria INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de categoría; obligatorio',
 MODIFY descripcion VARCHAR(255) NULL COMMENT 'Descripción opcional de categoría';
ALTER TABLE PUBLICACIONES
 MODIFY id_publicacion INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY id_usuario INT NOT NULL COMMENT 'FK a USUARIOS; autor obligatorio',
 MODIFY id_categoria INT NOT NULL COMMENT 'FK a CATEGORIAS; clasificación obligatoria',
 MODIFY tipo_contenido ENUM('texto','imagen','video','mixto') NOT NULL COMMENT 'Tipo permitido: texto imagen video o mixto',
 MODIFY contenido TEXT NULL COMMENT 'Texto de publicación; máximo 2000 caracteres en aplicación',
 MODIFY nombre_archivo VARCHAR(255) NULL COMMENT 'Nombre original del adjunto opcional',
 MODIFY multimedia LONGBLOB NULL COMMENT 'Imagen o vídeo binario opcional; máximo 50 MiB en aplicación',
 MODIFY mime_type VARCHAR(100) NULL COMMENT 'MIME validado de la multimedia',
 MODIFY tamano_bytes BIGINT UNSIGNED NULL COMMENT 'Longitud del archivo en bytes; entero no negativo',
 MODIFY fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento de creación automático',
 MODIFY estado VARCHAR(50) DEFAULT 'activo' COMMENT 'Visibilidad lógica; activo para feed';
ALTER TABLE PRODUCTOS
 MODIFY id_producto INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY id_usuario INT NOT NULL COMMENT 'FK a USUARIOS; vendedor',
 MODIFY id_categoria INT NOT NULL COMMENT 'FK a CATEGORIAS; clasificación',
 MODIFY nombre VARCHAR(100) NOT NULL COMMENT 'Nombre obligatorio del producto',
 MODIFY precio DECIMAL(10,2) NOT NULL COMMENT 'Precio en moneda local; importe decimal',
 MODIFY stock INT NOT NULL DEFAULT 0 COMMENT 'Unidades disponibles; entero, predeterminado cero',
 MODIFY estado VARCHAR(50) DEFAULT 'disponible' COMMENT 'Estado lógico del producto';
ALTER TABLE SERVICIOS
 MODIFY id_servicio INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY id_usuario INT NOT NULL COMMENT 'FK a USUARIOS; proveedor',
 MODIFY id_categoria INT NOT NULL COMMENT 'FK a CATEGORIAS; clasificación',
 MODIFY nombre VARCHAR(100) NOT NULL COMMENT 'Nombre obligatorio del servicio',
 MODIFY precio_base DECIMAL(10,2) NOT NULL COMMENT 'Importe base decimal del servicio',
 MODIFY estado VARCHAR(50) DEFAULT 'activo' COMMENT 'Estado lógico del servicio';
ALTER TABLE MENSAJES
 MODIFY id_mensaje INT AUTO_INCREMENT COMMENT 'PK; identificador positivo autogenerado',
 MODIFY id_emisor INT NOT NULL COMMENT 'FK a USUARIOS; remitente',
 MODIFY id_receptor INT NOT NULL COMMENT 'FK a USUARIOS; destinatario',
 MODIFY contenido TEXT NOT NULL COMMENT 'Texto obligatorio del mensaje',
 MODIFY fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento de envío automático',
 MODIFY leido BOOLEAN DEFAULT FALSE COMMENT 'Indicador booleano de lectura: 0 o 1';
ALTER TABLE USUARIO_INTERESES
 MODIFY id_usuario INT NOT NULL COMMENT 'PK compuesta y FK a USUARIOS',
 MODIFY interes VARCHAR(30) NOT NULL COMMENT 'PK compuesta; dominio validado: diseno programacion fotografia video artesanias musica educacion creadores';

CREATE TABLE COMENTARIOS (
 id_comentario INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK; identificador autogenerado',
 id_publicacion INT NOT NULL COMMENT 'FK a PUBLICACIONES; publicación comentada',
 id_usuario INT NOT NULL COMMENT 'FK a USUARIOS; autor del comentario',
 contenido VARCHAR(300) NOT NULL COMMENT 'Texto obligatorio de 1 a 300 caracteres',
 fecha_comentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora automática',
 CONSTRAINT fk_comentarios_publicacion FOREIGN KEY(id_publicacion) REFERENCES PUBLICACIONES(id_publicacion) ON DELETE CASCADE,
 CONSTRAINT fk_comentarios_usuario FOREIGN KEY(id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
) COMMENT='Comentarios persistentes de publicaciones';
CREATE TABLE VALORACIONES (
 id_publicacion INT NOT NULL COMMENT 'PK compuesta y FK a PUBLICACIONES',
 id_usuario INT NOT NULL COMMENT 'PK compuesta y FK a USUARIOS; un voto por usuario',
 estrellas TINYINT UNSIGNED NOT NULL COMMENT 'Puntuación entera de 1 a 5',
 fecha_valoracion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última valoración',
 PRIMARY KEY(id_publicacion,id_usuario),
 CONSTRAINT chk_valoracion_estrellas CHECK(estrellas BETWEEN 1 AND 5),
 CONSTRAINT fk_valoracion_publicacion FOREIGN KEY(id_publicacion) REFERENCES PUBLICACIONES(id_publicacion) ON DELETE CASCADE,
 CONSTRAINT fk_valoracion_usuario FOREIGN KEY(id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
) COMMENT='Calificaciones de una a cinco estrellas';

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
