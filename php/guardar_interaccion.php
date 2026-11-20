<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';
function salida($datos,$codigo=200) {
 http_response_code($codigo);
 echo json_encode($datos,JSON_UNESCAPED_UNICODE);
 exit;
}
if (empty($_SESSION['user_id'])) salida(['error'=>'Debes iniciar sesión.'],401);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') salida(['error'=>'Método no permitido.'],405);
$id=filter_input(INPUT_POST,'id_publicacion',FILTER_VALIDATE_INT);
if (!$id || $id<1) salida(['error'=>'Publicación inválida.'],400);
$usuario=(int)$_SESSION['user_id'];
$accion=$_POST['accion']??'';
try {
 if ($accion==='comentar') {
  $texto=trim($_POST['contenido']??'');
  if ($texto==='' || mb_strlen($texto)>300) salida(['error'=>'El comentario debe tener entre 1 y 300 caracteres.'],400);
  $stmt=$conexion->prepare('CALL sp_crear_comentario(?,?,?)');
  $stmt->bind_param('iis',$id,$usuario,$texto);
 } elseif ($accion==='valorar') {
  $estrellas=filter_input(INPUT_POST,'estrellas',FILTER_VALIDATE_INT);
  if (!$estrellas || $estrellas<1 || $estrellas>5) salida(['error'=>'Elige de 1 a 5 estrellas.'],400);
  $stmt=$conexion->prepare('CALL sp_valorar_publicacion(?,?,?)');
  $stmt->bind_param('iii',$id,$usuario,$estrellas);
 } else salida(['error'=>'Acción inválida.'],400);
 $stmt->execute();
 $stmt->close();
 salida(['success'=>true]);
} catch(Throwable $e) {
 error_log('Guardar interacción: '.$e->getMessage());
 salida(['error'=>'No se pudo guardar. Verifica que la publicación exista.'],500);
}
