const items = [
{id:1,type:'service',title:'Modelado 3D para videojuegos',desc:'Props y escenarios optimizados.',author:'Alex García',price:850},
{id:2,type:'service',title:'Diseño de identidad visual',desc:'Logotipo, paleta y guía básica.',author:'Lucía Martínez',price:1200},
{id:3,type:'service',title:'Edición de video',desc:'Edición dinámica para redes.',author:'Diego Ramírez',price:600},
{id:4,type:'product',title:'Lámpara artesanal de piedra',desc:'Pieza decorativa hecha a mano.',author:'Taller Norte',price:480},
{id:5,type:'product',title:'Print artístico',desc:'Ilustración impresa de edición limitada.',author:'Mara Studio',price:220},
{id:6,type:'product',title:'Accesorio personalizado',desc:'Objeto diseñado bajo pedido.',author:'Crear MX',price:350},
{id:7,type:'portfolio',title:'Escena costera en 3D',desc:'Proyecto de ambiente y composición.',author:'Alex García'},
{id:8,type:'portfolio',title:'Campaña visual',desc:'Exploración de branding.',author:'Lucía Martínez'},
{id:9,type:'portfolio',title:'Cortometraje experimental',desc:'Edición, color y narrativa.',author:'Diego Ramírez'}];

const $ = s => document.querySelector(s);
let filter = 'all';
function card(x) {
    return `<article class="card"><div class="visual">${x.type==='service'?'Servicio':x.type==='product'?'Producto':'Portafolio'}</div><div class="body"><h3>${x.title}</h3><p>${x.desc}</p><div class="meta"><span>${x.author}</span><b class="price">${x.price?'$'+x.price.toLocaleString('es-MX')+' MXN':'Proyecto'}</b></div><button class="action" data-id="${x.id}">${x.type==='product'?'Agregar al pedido':x.type==='service'?'Contactar':'Ver proyecto'}</button></div></article>`;
}
function render() {
    let q=$('#search').value.toLowerCase();let list=items.filter(x=>(filter==='all'||x.type===filter)&&(`${x.title} ${x.desc} ${x.author}`).toLowerCase().includes(q));$('#exploreGrid').innerHTML = list.map(card).join('');
    $('#servicesGrid').innerHTML = items.filter(x => x.type === 'service').map(card).join('');
    $('#productsGrid').innerHTML = items.filter(x => x.type === 'product').map(card).join('');}
$('.filters').addEventListener('click', e => {if(e.target.dataset.filter){filter=e.target.dataset.filter;document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');render()}});

$('#search').addEventListener('input',render);document.addEventListener('click', e => {if(e.target.classList.contains('action')){let x=items.find(i=>i.id==e.target.dataset.id);alert(x.type==='product'?'Producto agregado al pedido de ejemplo.':'Acción de demostración para: '+x.title)}});
const chats = {lucia:{name:'Lucía Martínez',messages:['Vi tu portafolio, me interesa tu trabajo.']},diego:{name:'Diego Ramírez',messages:['¿Tienes disponibilidad esta semana?']}};

let current = 'lucia';function chatsRender() {
     $('#contacts').innerHTML=Object.keys(chats).map(k=>`<button class="contact ${k===current?'active':''}" data-chat="${k}">${chats[k].name}</button>`).join('');$('#chatHeader').innerHTML=chats[current].name+'<small>Conversación de ejemplo</small>';$('#messages').innerHTML=chats[current].messages.map((m,i)=>`<div class="message ${i%2?'mine':''}">${m}</div>`).join('')}

$('#contacts').addEventListener('click', e => {if(e.target.dataset.chat){current=e.target.dataset.chat;chatsRender()}});

$('#messageForm').addEventListener('submit',e=>{e.preventDefault();let v=$('#messageInput').value.trim();if(v){chats[current].messages.push(v);$('#messageInput').value='';chatsRender()}});

function openModal() {
    $('#modal').classList.remove('hidden')}

$('#registerBtn').onclick=openModal;
$('#startBtn').onclick=openModal;
$('#close').onclick=()=>$('#modal').classList.add('hidden');
$('#accountForm').onsubmit=e=>{e.preventDefault();$('#feedback').textContent='Demo: formulario validado localmente.'};
$('#newService').onclick=()=>alert('Aquí se abriría el formulario para publicar un servicio.');
$('#newProduct').onclick=()=>alert('Aquí se abriría el formulario para registrar un producto.');
render();
chatsRender();
