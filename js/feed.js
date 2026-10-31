const publicacionesIniciales = [];

const sugerencias = [
  { nombre: 'Ana Castillo', iniciales: 'AC', profesion: 'Diseñadora', avatar: 'purple' },
  { nombre: 'Roberto Morales', iniciales: 'RM', profesion: 'Programador', avatar: 'orange' },
  { nombre: 'Carla López', iniciales: 'CL', profesion: 'Ilustradora', avatar: 'pink' }
];

const postsContainer = document.querySelector('#postsContainer');
const suggestionsContainer = document.querySelector('#suggestionsContainer');
const modalElement = document.querySelector('#postModal');
const postModal = new bootstrap.Modal(modalElement);
const createPostForm = document.querySelector('#createPostForm');
const postText = document.querySelector('#postText');
const postFile = document.querySelector('#postFile');
const fileName = document.querySelector('#fileName');
const postFormMessage = document.querySelector('#postFormMessage');
let publicaciones = [];
let filtroActual = 'all';
let siguienteId = 1;

const escaparHTML = (valor = '') => String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);

function renderizarComentarios(comentarios) {
  return comentarios.map(comentario => `
    <div class="comment">
      <span class="comment-avatar avatar-${escaparHTML(comentario.avatar)}">${escaparHTML(comentario.iniciales)}</span>
      <div class="comment-body"><strong>${escaparHTML(comentario.autor)}</strong><p>${escaparHTML(comentario.texto)}</p></div>
    </div>`).join('');
}

function renderizarPublicacion(post) {
  
const medio = post.tipo === 'text'
  ? ''
  : post.url
    ? (post.tipo === 'video'
      ? `<video src="${escaparHTML(post.url)}" controls preload="metadata"></video>`
      : `<img src="${escaparHTML(post.url)}" alt="Archivo compartido por ${escaparHTML(post.autor)}">`)
    : `<div class="media-placeholder purple-media">
         <i class="bi ${post.tipo === 'video' ? 'bi-play-btn' : 'bi-image'}"></i>
         <span>${escaparHTML(post.media || 'Contenido multimedia')}</span>
       </div>`;

  return `<article class="post-card" data-type="${escaparHTML(post.tipo)}" data-category="${escaparHTML(post.categoria)}" data-post-id="${post.id}">
    <div class="post-header"><div class="post-user"><span class="post-avatar avatar-${escaparHTML(post.avatar)}">${escaparHTML(post.iniciales)}</span><div><strong>${escaparHTML(post.autor)}</strong><span>${escaparHTML(post.profesion)} · ${escaparHTML(post.tiempo)}</span></div></div><button class="post-menu" type="button" aria-label="Más opciones"><i class="bi bi-three-dots"></i></button></div>
    <div class="post-content"><p>${escaparHTML(post.texto)}</p><div class="post-tags"><span>#${escaparHTML(post.etiqueta)}</span></div></div>
    ${medio ? `<div class="post-media ${post.tipo === 'video' ? 'video-media' : ''}">${medio}</div>` : ''} 
    <div class="post-actions"><button class="action-btn like-btn" type="button" aria-pressed="false"><i class="bi bi-heart"></i><span>${post.likes}</span></button><button class="action-btn comment-btn" type="button"><i class="bi bi-chat"></i><span>${post.comentarios.length}</span></button></div>
    <section class="comments-section"><div class="comments-title">Comentarios</div><div class="comments-list">${renderizarComentarios(post.comentarios)}</div><form class="comment-form"><span class="comment-avatar avatar-user">CG</span><input type="text" name="comment" maxlength="300" placeholder="Escribe un comentario..." aria-label="Escribe un comentario" required><button type="submit" aria-label="Enviar comentario"><i class="bi bi-send"></i></button></form></section>
  </article>`;
}


async function cargarPublicaciones() {
  postsContainer.innerHTML =
    '<p class="empty-state">Cargando publicaciones...</p>';

  try {
    const respuesta = await fetch('../php/obtener_publicaciones.php');

    if (!respuesta.ok) {
      throw new Error('Error al consultar las publicaciones.');
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error(
        datos.error || 'La respuesta del servidor no es válida.'
      );
    }

    publicaciones = datos.map(post => {
      const nombre = post.nombre || 'Usuario';
      const partesNombre = nombre.trim().split(/\s+/);

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

     let url = '';

     if (
       post.tiene_multimedia &&
       (post.tipo_contenido === 'imagen' ||
       post.tipo_contenido === 'video')
       ) {
       url = '../php/obtener_multimedia.php?id='
       + encodeURIComponent(post.id_publicacion);
      }

      return {
        id: Number(post.id_publicacion),
        autor: nombre,
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
        categoria: 'all',
        tipo,
        avatar: 'purple',
        media: post.nombre_archivo || 'Publicación de texto',
        url,
        likes: 0,
        comentarios: []
      };
    });

    siguienteId = publicaciones.length
      ? Math.max(...publicaciones.map(post => post.id)) + 1
      : 1;

    renderizarPublicaciones();

  } catch (error) {
    console.error('Error al cargar el feed:', error);

    postsContainer.innerHTML =
      '<p class="empty-state">No se pudieron cargar las publicaciones. Verifica la conexión con el servidor.</p>';
  }
}

function renderizarPublicaciones() {
  const visibles = publicaciones.filter(post => filtroActual === 'all' || post.tipo === filtroActual || post.categoria === filtroActual);
  postsContainer.innerHTML = visibles.length ? visibles.map(renderizarPublicacion).join('') : '<p class="empty-state">No hay publicaciones para este filtro.</p>';
}

function renderizarSugerencias() {
  suggestionsContainer.innerHTML = sugerencias.map(persona => `<div class="suggestion"><span class="suggestion-avatar avatar-${persona.avatar}">${persona.iniciales}</span><div class="suggestion-info"><strong>${persona.nombre}</strong><span>${persona.profesion}</span></div><button type="button" class="follow-btn">Seguir</button></div>`).join('');
}

const openPostModalButton = document.querySelector('#openPostModal');

if (openPostModalButton) {
    openPostModalButton.addEventListener('click', () => {
        createPostForm.reset();
        fileName.textContent = '';
        postFormMessage.textContent = '';
        postModal.show();
    });
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

postFile.addEventListener('change', () => {
  const archivo = postFile.files[0];
  fileName.textContent = archivo ? `${archivo.name} (${Math.round(archivo.size / 1024)} KB)` : '';
  postFormMessage.textContent = '';
});

document.querySelectorAll('input[name="postType"]').forEach(input => input.addEventListener('change', () => {
  postFile.accept = input.value === 'video' ? 'video/*' : 'image/*';
  postFile.value = '';
  fileName.textContent = '';
}));

createPostForm.addEventListener('submit', event => {
  event.preventDefault();
  const texto = postText.value.trim();
  const archivo = postFile.files[0];
  const tipo = createPostForm.elements.postType.value;
  if (!texto && !archivo) {
    postFormMessage.textContent = 'Escribe algo o selecciona un archivo para publicar.';
    return;
  }
  if (archivo && !(tipo === 'image' ? archivo.type.startsWith('image/') : archivo.type.startsWith('video/'))) {
    postFormMessage.textContent = `Selecciona un archivo válido para ${tipo === 'image' ? 'imagen' : 'video'}.`;
    return;
  }
  const categoria = document.querySelector('#postCategory').value;
  const categorias = { design: 'Diseño', programming: 'Programación', photography: 'Fotografía', art: 'Arte', education: 'Educación', other: 'Otro' };
  const url = post.tiene_multimedia && post.url_multimedia
    ? post.url_multimedia
    : ''; 
  publicaciones.unshift({ id: siguienteId++, autor: 'Cesar García', iniciales: 'CG', profesion: 'Creador independiente', tiempo: 'Ahora', texto: texto || 'Comparto un nuevo proyecto.', etiqueta: categorias[categoria], categoria, tipo: archivo ? tipo : 'image', avatar: 'purple', media: archivo ? archivo.name : 'Publicación de texto', url, likes: 0, comentarios: [] });
  filtroActual = 'all';
  document.querySelectorAll('.filter-btn').forEach(boton => boton.classList.toggle('active', boton.dataset.filter === 'all'));
  renderizarPublicaciones();
  postModal.hide();
  createPostForm.reset();
  fileName.textContent = '';
});

console.log("FEED.JS ACTUALIZADO");

renderizarSugerencias();

cargarPublicaciones().then(() => {
  console.log("Publicaciones cargadas:", publicaciones);
}); 
 
 