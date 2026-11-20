const sugerencias = [
  { nombre: 'Ana Castillo', iniciales: 'AC', profesion: 'Diseñadora', avatar: 'purple' },
  { nombre: 'Roberto Morales', iniciales: 'RM', profesion: 'Programador', avatar: 'orange' },
  { nombre: 'Carla López', iniciales: 'CL', profesion: 'Ilustradora', avatar: 'pink' }
];

const postsContainer = document.querySelector('#postsContainer');
const suggestionsContainer = document.querySelector('#suggestionsContainer');
let publicaciones = [];
let filtroActual = 'all';

const escaparHTML = (valor = '') => String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);

function renderizarComentarios(comentarios) {
  return comentarios.map(comentario => `
    <div class="comment">
      <span class="comment-avatar avatar-${escaparHTML(comentario.avatar)}">${escaparHTML(comentario.iniciales)}</span>
      <div class="comment-body"><strong>${escaparHTML(comentario.autor)}</strong><p>${escaparHTML(comentario.texto)}</p></div>
    </div>`).join('');
}


function renderizarPublicacion(post) {

  let medio = '';

  // NUEVO: mostrar varias imágenes de una publicación.
  if (post.tipo === 'image' && post.imagenes.length > 0) {

    medio = post.imagenes.map((imagen, indice) => `
      <img
        src="${escaparHTML(imagen.url)}"
        alt="Imagen ${indice + 1} compartida por ${escaparHTML(post.autor)}"
        loading="lazy"
      >
    `).join('');

  // Video nuevo o antiguo.
  } else if (post.tipo === 'video' && post.url) {

    medio = `
      <video
        src="${escaparHTML(post.url)}"
        controls
        preload="metadata"
      ></video>
    `;

  // Imagen antigua almacenada directamente en PUBLICACIONES.
  } else if (post.tipo === 'image' && post.url) {

    medio = `
      <img
        src="${escaparHTML(post.url)}"
        alt="Archivo compartido por ${escaparHTML(post.autor)}"
        loading="lazy"
      >
    `;

  // Publicación sin archivo multimedia.
  } else if (post.tipo !== 'text') {

    medio = `
      <div class="media-placeholder purple-media">
        <i class="bi ${post.tipo === 'video' ? 'bi-play-btn' : 'bi-image'}"></i>
        <span>${escaparHTML(post.media || 'Contenido multimedia')}</span>
      </div>
    `;
  }

  return `<article class="post-card" data-type="${escaparHTML(post.tipo)}" data-category="${escaparHTML(post.categoria)}" data-post-id="${post.id}">
    <div class="post-header">
      <div class="post-user">
        <span
          class="post-avatar avatar-${escaparHTML(post.avatar)}"
          style="position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center;"
        >
          ${escaparHTML(post.iniciales)}

          ${post.fotoPerfil ? `
            <img
              src="${escaparHTML(post.fotoPerfil)}"
              alt="Foto de ${escaparHTML(post.autor)}"
              style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
              onerror="this.remove()"
            >
          ` : ''}
        </span>

        <div>
          <strong>${escaparHTML(post.autor)}</strong>
          <span>${escaparHTML(post.profesion)} · ${escaparHTML(post.tiempo)}</span>
        </div>
      </div>

      <button class="post-menu" type="button" aria-label="Más opciones">
        <i class="bi bi-three-dots"></i>
      </button>
    </div>

    <div class="post-content">
      <p>${escaparHTML(post.texto)}</p>
      <div class="post-tags">
        <span>#${escaparHTML(post.etiqueta)}</span>
      </div>
    </div>

    ${medio ? `
      <div class="post-media ${post.tipo === 'video' ? 'video-media' : ''}">
        ${medio}
      </div>
    ` : ''}

    <div class="post-actions">
      <button class="action-btn like-btn" type="button" aria-pressed="false">
        <i class="bi bi-heart"></i>
        <span>${post.likes}</span>
      </button>

      <button class="action-btn comment-btn" type="button">
        <i class="bi bi-chat"></i>
        <span>${post.comentarios.length}</span>
      </button>
    </div>

    <section class="comments-section">
      <div class="comments-title">Comentarios</div>

      <div class="comments-list">
        ${renderizarComentarios(post.comentarios)}
      </div>

      <form class="comment-form">
        <span class="comment-avatar avatar-user">CG</span>
        <input
          type="text"
          name="comment"
          maxlength="300"
          placeholder="Escribe un comentario..."
          aria-label="Escribe un comentario"
          required
        >
        <button type="submit" aria-label="Enviar comentario">
          <i class="bi bi-send"></i>
        </button>
      </form>
    </section>
  </article>`;
}

async function cargarPublicaciones() {
  postsContainer.innerHTML =
    '<p class="empty-state">Cargando publicaciones...</p>';

  try {
    const respuesta = await fetch('../php/obtener_feed.php', {
        method: 'GET',
        credentials: 'same-origin'
    });

    if (!respuesta.ok) {
      throw new Error('Error al consultar las publicaciones.');
    }

    const datos = await respuesta.json();
    console.log("DATOS RECIBIDOS DE PHP:", datos);
    console.log("PRIMER ID DE USUARIO:", datos[0]?.id_usuario);
    console.log("PRIMERA PUBLICACION:", datos[0]); 

    if (!Array.isArray(datos)) {
      throw new Error(
        datos.error || 'La respuesta del servidor no es válida.'
      );
    }
    console.log("ENTRÉ A LA TRANSFORMACIÓN MAP"); 
    publicaciones = datos.map(post => {
      console.log("ENTRÉ AL MAP:", post.id_publicacion);
      console.log("ID USUARIO ORIGINAL:", post.id_usuario);
      console.log("ID DEL AUTOR:", post.id_usuario);
      const nombre = post.nombre || 'Usuario';
      const partesNombre = nombre.trim().split(/\s+/);

      console.log("ANTES DE CREAR OBJETO:", {
          idUsuario: Number(post.id_usuario),
          fotoPerfil: `../php/obtener_foto_perfil.php?id=${post.id_usuario}`
      });

      const tipo = post.tipo_contenido === 'imagen'
        ? 'image'
        : post.tipo_contenido === 'video'
          ? 'video'
          : 'text';

      const fecha = post.fecha_publicacion
        ? new Date(post.fecha_publicacion.replace(' ', 'T'))
        : null;

      const tiempo = fecha && !Number.isNaN(fecha.getTime())
        ? fecha.toLocaleString('es-MX', {
            dateStyle: 'short',
            timeStyle: 'short'
          })
        : 'Fecha no disponible';

      // URL para videos nuevos y archivos antiguos.
      let url = '';

      if (
        post.tiene_multimedia &&
        (post.tipo_contenido === 'imagen' ||
        post.tipo_contenido === 'video')
      ) {
        url = '../php/obtener_multimedia.php?id='
          + encodeURIComponent(post.id_publicacion);
      }

      // obtenemos las imagenes individuales de la publicación.
      const imagenes = Array.isArray(post.multimedia_imagenes)
        ? post.multimedia_imagenes
        : [];

      console.log(
          "URL DE FOTO:",
          '../php/obtener_foto_perfil.php?id=' +
          encodeURIComponent(post.id_usuario)
      );
      console.log("ESTOY CREANDO EL OBJETO:", post.id_publicacion, post.id_usuario); 
      return {
          id: Number(post.id_publicacion),

          idUsuario: Number(post.id_usuario),

          autor: nombre,

          fotoPerfil: post.id_usuario
              ? `../php/obtener_foto_perfil.php?id=${encodeURIComponent(post.id_usuario)}`
              : null,

          iniciales: partesNombre
              .slice(0, 2)
              .map(palabra => palabra.charAt(0).toUpperCase())
              .join(''),
        profesion: 'Usuario de FreeLink',
        tiempo,
        texto: post.contenido || '',
        etiqueta: post.tipo_contenido === 'imagen'
          ? 'Imagen'
          : post.tipo_contenido === 'video'
            ? 'Video'
            : 'Publicación',
        idCategoria: Number(post.id_categoria),
        categoria: post.categoria || '',
        tipo,
        avatar: 'purple',
        media: post.nombre_archivo || 'Publicación de texto',
        url,
        imagenes,
        likes: 0,
        comentarios: []
      };
    });

    console.log("PRIMER OBJETO TRANSFORMADO:", publicaciones[0]);
    console.log("ID USUARIO TRANSFORMADO:", publicaciones[0]?.idUsuario);
    console.log("FOTO PERFIL TRANSFORMADA:", publicaciones[0]?.fotoPerfil);
    renderizarPublicaciones();

  } catch (error) {
    console.error('Error al cargar el feed:', error);

    postsContainer.innerHTML =
      '<p class="empty-state">No se pudieron cargar las publicaciones. Verifica la conexión con el servidor.</p>';
  }
}

function renderizarPublicaciones() {

    const visibles = publicaciones.filter(post =>
        filtroActual === 'all' ||
        post.idCategoria === Number(filtroActual)
    );

    postsContainer.innerHTML = visibles.length
        ? visibles.map(renderizarPublicacion).join('')
        : '<p class="empty-state">No hay publicaciones para este filtro.</p>';
} 

function renderizarSugerencias() {
  suggestionsContainer.innerHTML = sugerencias.map(persona => `<div class="suggestion"><span class="suggestion-avatar avatar-${persona.avatar}">${persona.iniciales}</span><div class="suggestion-info"><strong>${persona.nombre}</strong><span>${persona.profesion}</span></div><button type="button" class="follow-btn">Seguir</button></div>`).join('');
}

document.querySelector('.filters').addEventListener('click', event => {
  const boton = event.target.closest('[data-filter]');
  if (!boton) return;
  filtroActual = boton.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(item => item.classList.toggle('active', item === boton));
  renderizarPublicaciones();
});

postsContainer.addEventListener('click', event => {
  const tarjeta = event.target.closest('[data-post-id]');
  if (!tarjeta) return;
  const post = publicaciones.find(item => item.id === Number(tarjeta.dataset.postId));
  if (!post) return;
  const likeButton = event.target.closest('.like-btn');
  if (likeButton) {
    const gustado = likeButton.classList.toggle('liked');
    likeButton.setAttribute('aria-pressed', String(gustado));
    likeButton.querySelector('i').className = gustado ? 'bi bi-heart-fill' : 'bi bi-heart';
    post.likes += gustado ? 1 : -1;
    likeButton.querySelector('span').textContent = post.likes;
  }
  if (event.target.closest('.comment-btn')) tarjeta.querySelector('.comment-form input').focus();
});

postsContainer.addEventListener('submit', event => {
  if (!event.target.matches('.comment-form')) return;
  event.preventDefault();
  const input = event.target.elements.comment;
  const texto = input.value.trim();
  if (!texto) return;
  const tarjeta = event.target.closest('[data-post-id]');
  const post = publicaciones.find(item => item.id === Number(tarjeta.dataset.postId));
  post.comentarios.push({ autor: 'Cesar García', iniciales: 'CG', avatar: 'user', texto });
  renderizarPublicaciones();
  const actualizada = postsContainer.querySelector(`[data-post-id="${post.id}"] .comment-form input`);
  if (actualizada) actualizada.focus();
});

suggestionsContainer.addEventListener('click', event => {
  const boton = event.target.closest('.follow-btn');
  if (!boton) return;
  const siguiendo = boton.classList.toggle('following');
  boton.textContent = siguiendo ? 'Siguiendo' : 'Seguir';
});

console.log("FEED.JS ACTUALIZADO");
console.log("PRUEBA DE ARCHIVO NUEVO 12345");

renderizarSugerencias();

cargarPublicaciones().then(() => {
  console.log("Publicaciones cargadas:", publicaciones);
}); 
 
 