// ✅ Inicializa EmailJS correctamente
(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwbuGpcYr7LPurHdLgI03hqmScNh6pl_-tuLhwRYASn7bs7Xk1-oTpzouydPZ6GX6aWug/exec";
  const proxyUrl = "https://proxyagenda.glow-nails-artt.workers.dev/?url=";

  // 🗓️ Lista de festivos (puedes agregar más)
  const festivos = ["2025-01-01", "2025-12-25", "2025-12-31"];

  // 🟢 Generar horarios de 8:00 a 17:00
  function generarHoras() {
    horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
    for (let h = 8; h <= 17; h++) {
      const hora = `${h.toString().padStart(2, "0")}:00`;
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    }
  }

  // ✨ Función de mensajes visuales (reemplaza alert)
  function mostrarMensaje(tipo, texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.left = "50%";
    div.style.transform = "translateX(-50%)";
    div.style.padding = "12px 20px";
    div.style.borderRadius = "8px";
    div.style.fontWeight = "600";
    div.style.zIndex = "1000";
    div.style.color = "#fff";
    div.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
    div.style.transition = "opacity 0.5s ease";

    if (tipo === "success") div.style.background = "#28a745";
    if (tipo === "error") div.style.background = "#dc3545";
    if (tipo === "warning") div.style.background = "#ffc107";

    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = "0";
      setTimeout(() => div.remove(), 500);
    }, 2500);
  }

  // 🟣 Loader para disponibilidad
  function mostrarLoader(mostrar) {
    if (mostrar) {
      horaSelect.innerHTML = '<option>Cargando disponibilidad...</option>';
      horaSelect.disabled = true;
    } else {
      horaSelect.disabled = false;
    }
  }

  // 🔴 Bloquear domingos y fechas pasadas
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  fechaInput.min = `${yyyy}-${mm}-${dd}`;

  // 🟢 Marcar horas ocupadas
  function mostrarHorasOcupadas(ocupadas = []) {
    generarHoras();
    const ahora = new Date();

    ocupadas.forEach(horaOcupada => {
      const opt = [...horaSelect.options].find(o => o.value === horaOcupada);
      if (opt) {
        opt.disabled = true;
        opt.textContent += " (Ocupada)";
      }
    });

    // Si es hoy, deshabilitar horas pasadas
    const fechaSeleccionada = new Date(fechaInput.value);
    if (
      fechaSeleccionada.getFullYear() === ahora.getFullYear() &&
      fechaSeleccionada.getMonth() === ahora.getMonth() &&
      fechaSeleccionada.getDate() === ahora.getDate()
    ) {
      const horaActual = ahora.getHours();
      [...horaSelect.options].forEach(opt => {
        const [h] = opt.value.split(":");
        if (parseInt(h) <= horaActual) {
          opt.disabled = true;
          opt.textContent += " (Pasada)";
        }
      });
    }
  }

  generarHoras();

  // 📅 Consultar disponibilidad
  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    if (!fecha) return;

    const seleccion = new Date(fecha);
    const diaSemana = seleccion.getDay();

    // Bloquear domingos
    if (diaSemana === 0) {
      mostrarMensaje("warning", "🚫 No se puede agendar los domingos.");
      fechaInput.value = "";
      generarHoras();
      return;
    }

    // Bloquear festivos
    if (festivos.includes(fecha)) {
      mostrarMensaje("warning", "🎉 No hay atención ese día festivo.");
      fechaInput.value = "";
      generarHoras();
      return;
    }

    const cacheKey = `ocupadas_${fecha}`;
    const cached = localStorage.getItem(cacheKey);
    mostrarLoader(true);

    if (cached) {
      mostrarHorasOcupadas(JSON.parse(cached));
      mostrarLoader(false);
      return;
    }

    try {
      const res = await fetch(`${proxyUrl}${googleScriptUrl}?fecha=${fecha}`);
      const data = await res.json();
      if (data.ocupadas && Array.isArray(data.ocupadas)) {
        localStorage.setItem(cacheKey, JSON.stringify(data.ocupadas));
        mostrarHorasOcupadas(data.ocupadas);
      } else mostrarHorasOcupadas([]);
    } catch (err) {
      mostrarMensaje("error", "Error al consultar disponibilidad.");
      generarHoras();
    } finally {
      mostrarLoader(false);
    }
  });

  // 🚀 Cargar horarios de hoy automáticamente si es día hábil
  const hoyDia = hoy.getDay();
  const hoyISO = `${yyyy}-${mm}-${dd}`;
  if (hoyDia !== 0 && !festivos.includes(hoyISO)) {
    fechaInput.value = hoyISO;
    fechaInput.dispatchEvent(new Event("change"));
  }

  // 📤 Enviar cita
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const servicio = document.getElementById("servicio").value;
    const fecha = fechaInput.value;
    const hora = horaSelect.value;

    if (!nombre || !email || !servicio || !fecha || !hora) {
      mostrarMensaje("warning", "⚠️ Completa todos los campos.");
      return;
    }

    if (horaSelect.selectedOptions[0].disabled) {
      mostrarMensaje("error", "🚫 Esta hora ya está ocupada.");
      return;
    }

    form.querySelector("button[type='submit']").disabled = true;

    try {
      await emailjs.send("service_tp0xzhi", "template_6csycq9", {
        to_name: nombre,
        to_email: email,
        servicio,
        fecha,
        hora,
      });

      const postData = { nombre, email, servicio, fecha, hora };
      const response = await fetch(`${proxyUrl}${googleScriptUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      if (result.success) {
        successMsg.style.display = "block";
        errorMsg.style.display = "none";
        form.reset();
        generarHoras();
        localStorage.removeItem(`ocupadas_${fecha}`);
        mostrarMensaje("success", "✅ Cita registrada correctamente.");
      } else throw new Error(result.message || "Error al crear la cita.");
    } catch (err) {
      errorMsg.style.display = "block";
      successMsg.style.display = "none";
      mostrarMensaje("error", "❌ No se pudo registrar la cita.");
    } finally {
      form.querySelector("button[type='submit']").disabled = false;
    }
  });
});
