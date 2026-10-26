const publicacionesIniciales = [
  { id: 1, autor: 'Angel García', iniciales: 'AG', profesion: 'Diseñador 3D', tiempo: 'Hace 25 min', texto: 'El modelo de mi nuevo personaje.', etiqueta: 'Diseño 3D', categoria: 'design', tipo: 'image', avatar: 'purple', media: 'Imagen del proyecto 3D', likes: 128, comentarios: [{ autor: 'Laura Méndez', iniciales: 'LM', avatar: 'orange', texto: 'Está increíble.' }, { autor: 'Juan Pérez', iniciales: 'JP', avatar: 'green', texto: '¿Cuánto tiempo te tomó?' }] },
  { id: 2, autor: 'Sofía Ramírez', iniciales: 'SR', profesion: 'Fotógrafa', tiempo: 'Hace 1 h', texto: 'Les comparto un detrás de cámaras de mi última sesión fotográfica.', etiqueta: 'Fotografía', categoria: 'photography', tipo: 'video', avatar: 'orange', media: 'Aquí se cargará el video', likes: 86, comentarios: [{ autor: 'Mariana Gómez', iniciales: 'MG', avatar: 'pink', texto: 'El resultado es asombroso.' }] },
  { id: 3, autor: 'Diego Velázquez', iniciales: 'DV', profesion: 'Ilustrador', tiempo: 'Hace 2 h', texto: 'Mi nueva ilustración digital.', etiqueta: 'Ilustración', categoria: 'art', tipo: 'image', avatar: 'green', media: 'Imagen de ilustración digital', likes: 214, comentarios: [] }
];

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
let publicaciones = [...publicacionesIniciales];
let filtroActual = 'all';
let siguienteId = 4;

const escaparHTML = (valor = '') => String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);

function renderizarComentarios(comentarios) {
  return comentarios.map(comentario => `
    <div class="comment">
      <span class="comment-avatar avatar-${escaparHTML(comentario.avatar)}">${escaparHTML(comentario.iniciales)}</span>
      <div class="comment-body"><strong>${escaparHTML(comentario.autor)}</strong><p>${escaparHTML(comentario.texto)}</p></div>
    </div>`).join('');
}

function renderizarPublicacion(post) {
  const medio = post.url
    ? (post.tipo === 'video'
      ? `<video src="${post.url}" controls preload="metadata"></video>`
      : `<img src="${post.url}" alt="Archivo compartido por ${escaparHTML(post.autor)}">`)
    : `<div class="media-placeholder ${post.avatar === 'orange' ? 'orange' : post.avatar === 'green' ? 'green' : 'purple'}-media"><i class="bi ${post.tipo === 'video' ? 'bi-play-btn' : post.categoria === 'art' ? 'bi-palette' : 'bi-image'}"></i><span>${escaparHTML(post.media || 'Contenido multimedia')}</span></div>`;

  return `<article class="post-card" data-type="${escaparHTML(post.tipo)}" data-category="${escaparHTML(post.categoria)}" data-post-id="${post.id}">
    <div class="post-header"><div class="post-user"><span class="post-avatar avatar-${escaparHTML(post.avatar)}">${escaparHTML(post.iniciales)}</span><div><strong>${escaparHTML(post.autor)}</strong><span>${escaparHTML(post.profesion)} · ${escaparHTML(post.tiempo)}</span></div></div><button class="post-menu" type="button" aria-label="Más opciones"><i class="bi bi-three-dots"></i></button></div>
    <div class="post-content"><p>${escaparHTML(post.texto)}</p><div class="post-tags"><span>#${escaparHTML(post.etiqueta)}</span></div></div>
    <div class="post-media ${post.tipo === 'video' ? 'video-media' : ''}">${medio}</div>
    <div class="post-actions"><button class="action-btn like-btn" type="button" aria-pressed="false"><i class="bi bi-heart"></i><span>${post.likes}</span></button><button class="action-btn comment-btn" type="button"><i class="bi bi-chat"></i><span>${post.comentarios.length}</span></button></div>
    <section class="comments-section"><div class="comments-title">Comentarios</div><div class="comments-list">${renderizarComentarios(post.comentarios)}</div><form class="comment-form"><span class="comment-avatar avatar-user">CG</span><input type="text" name="comment" maxlength="300" placeholder="Escribe un comentario..." aria-label="Escribe un comentario" required><button type="submit" aria-label="Enviar comentario"><i class="bi bi-send"></i></button></form></section>
  </article>`;
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
  const url = archivo ? URL.createObjectURL(archivo) : '';
  publicaciones.unshift({ id: siguienteId++, autor: 'Cesar García', iniciales: 'CG', profesion: 'Creador independiente', tiempo: 'Ahora', texto: texto || 'Comparto un nuevo proyecto.', etiqueta: categorias[categoria], categoria, tipo: archivo ? tipo : 'image', avatar: 'purple', media: archivo ? archivo.name : 'Publicación de texto', url, likes: 0, comentarios: [] });
  filtroActual = 'all';
  document.querySelectorAll('.filter-btn').forEach(boton => boton.classList.toggle('active', boton.dataset.filter === 'all'));
  renderizarPublicaciones();
  postModal.hide();
  createPostForm.reset();
  fileName.textContent = '';
});

renderizarSugerencias();
renderizarPublicaciones();
 
 