<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';
function salida($datos, $codigo=200) {
 http_response_code($codigo);
 echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
if (empty($_SESSION['user_id'])) salida(['error'=>'Debes iniciar sesión.'],401);
$usuario=(int)$_SESSION['user_id'];
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if (!$id || $id<1) salida(['error'=>'Publicación inválida.'],400);
try {
 $stmt=$conexion->prepare('CALL sp_listar_comentarios(?)');
 $stmt->bind_param('i',$id);
 $stmt->execute();
 $comentarios=$stmt->get_result()->fetch_all(MYSQLI_ASSOC);
 $stmt->close();
 salida(['comentarios'=>$comentarios]);
} catch(Throwable $e) {
 error_log('Consultar comentarios: '.$e->getMessage());
 salida(['error'=>'No se pudieron cargar los comentarios.'],500);
}
