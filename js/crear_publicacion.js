document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formPublicacion");
    const campoTexto = document.getElementById("textoPublicacion");
    const contadorTexto = document.getElementById("contadorTexto");
    const inputArchivos = document.getElementById("archivosPublicacion");
    const listaArchivos = document.getElementById("listaArchivos");
    const textoVistaPrevia = document.getElementById("textoVistaPrevia");
    const multimediaVistaPrevia = document.getElementById("multimediaVistaPrevia");
    const mensajePublicacion = document.getElementById("mensajePublicacion");

    // Archivos seleccionados por el usuario.
    let archivosSeleccionados = [];

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm"
    ];

    // Formatear el tamaño de un archivo.
    function formatearTamano(bytes) {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Actualizar el contador y el texto de la vista previa.
    function actualizarTexto() {
        const texto = campoTexto.value;

        contadorTexto.textContent = texto.length;

        textoVistaPrevia.textContent =
            texto.trim() || "Tu texto aparecerá aquí cuando empieces a escribir.";
    }

    // Mostrar mensajes debajo del formulario.
    function mostrarMensaje(mensaje) {
        mensajePublicacion.textContent = mensaje;
        mensajePublicacion.hidden = false;
    }

    // Crear un elemento visual para cada archivo.
    function crearTarjetaArchivo(archivo, indice) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "archivo-seleccionado";

        if (archivo.type.startsWith("image/")) {
            const miniatura = document.createElement("img");
            miniatura.className = "miniatura-archivo";
            miniatura.src = URL.createObjectURL(archivo);
            miniatura.alt = `Vista previa de ${archivo.name}`;

            tarjeta.appendChild(miniatura);
        } else {
            const icono = document.createElement("div");
            icono.className = "icono-archivo";
            icono.innerHTML = '<i class="bi bi-camera-video"></i>';

            tarjeta.appendChild(icono);
        }

        const datos = document.createElement("div");
        datos.className = "datos-archivo";

        const nombre = document.createElement("strong");
        nombre.textContent = archivo.name;

        const tamano = document.createElement("span");
        tamano.textContent = formatearTamano(archivo.size);

        datos.append(nombre, tamano);
        tarjeta.appendChild(datos);

        const botonQuitar = document.createElement("button");
        botonQuitar.type = "button";
        botonQuitar.className = "quitar-archivo";
        botonQuitar.setAttribute("aria-label", `Quitar ${archivo.name}`);
        botonQuitar.innerHTML = '<i class="bi bi-x-lg"></i>';

        botonQuitar.addEventListener("click", () => {
            archivosSeleccionados.splice(indice, 1);
            actualizarArchivos();
        });

        tarjeta.appendChild(botonQuitar);

        return tarjeta;
    }

    // Dibujar la lista de archivos y la vista previa multimedia.
    function actualizarArchivos() {
        listaArchivos.replaceChildren();
        multimediaVistaPrevia.replaceChildren();

        archivosSeleccionados.forEach((archivo, indice) => {
            listaArchivos.appendChild(
                crearTarjetaArchivo(archivo, indice)
            );

            const urlTemporal = URL.createObjectURL(archivo);

            if (archivo.type.startsWith("image/")) {
                const imagen = document.createElement("img");
                imagen.src = urlTemporal;
                imagen.alt = `Imagen: ${archivo.name}`;
                multimediaVistaPrevia.appendChild(imagen);
            } else if (archivo.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.src = urlTemporal;
                video.controls = true;
                video.preload = "metadata";
                video.setAttribute("aria-label", `Video: ${archivo.name}`);
                multimediaVistaPrevia.appendChild(video);
            }
        });
    }

    // Detectar cuando se escribe en el campo de texto.
    campoTexto.addEventListener("input", () => {
        actualizarTexto();
        mensajePublicacion.hidden = true;
    });

    // Agregar los archivos elegidos sin duplicarlos.
    inputArchivos.addEventListener("change", () => {
        const nuevosArchivos = Array.from(inputArchivos.files);
        const rechazados = [];

        nuevosArchivos.forEach((archivo) => {
            if (!tiposPermitidos.includes(archivo.type)) {
                rechazados.push(archivo.name);
                return;
            }

            const yaExiste = archivosSeleccionados.some(
                (existente) =>
                    existente.name === archivo.name &&
                    existente.size === archivo.size &&
                    existente.lastModified === archivo.lastModified
            );

            if (!yaExiste) {
                archivosSeleccionados.push(archivo);
            }
        });

        actualizarArchivos();

        if (rechazados.length > 0) {
            mostrarMensaje(
                `No se aceptaron estos archivos: ${rechazados.join(", ")}. ` +
                "Selecciona imágenes JPG, PNG o WEBP, o videos MP4 o WEBM."
            );
        } else {
            mensajePublicacion.hidden = true;
        }

        // Permitir volver a elegir el mismo archivo.
        inputArchivos.value = "";
    });

    // Por ahora, el formulario solo funciona en el frontend
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const texto = campoTexto.value.trim();

        if (!texto && archivosSeleccionados.length === 0) {
            mostrarMensaje(
                "Escribe algo o agrega una imagen o un video antes de continuar."
            );
            return;
        }

        mostrarMensaje(
    "La vista previa está lista. La publicación todavía no se guarda: " +
    "falta conectar el formulario con PHP y MySQL."
        );
    });

    // Estado inicial.
    actualizarTexto();
    actualizarArchivos();
});
 