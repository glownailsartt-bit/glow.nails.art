// ✅ Inicializa EmailJS
(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB");
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  const googleScriptUrl =
    "https://script.google.com/macros/s/AKfycbwbuGpcYr7LPurHdLgI03hqmScNh6pl_-tuLhwRYASn7bs7Xk1-oTpzouydPZ6GX6aWug/exec";
  const proxyUrl = "https://proxyagenda.glow-nails-artt.workers.dev/?url=";

  // 🕓 Generar horarios de 8:00 a 17:00
  function generarHoras(horasDeshabilitadas = []) {
    horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
    for (let h = 8; h <= 17; h++) {
      const hora = `${h.toString().padStart(2, "0")}:00`;
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      if (horasDeshabilitadas.includes(hora)) {
        option.disabled = true;
        option.textContent += " (Ocupada)";
      }
      horaSelect.appendChild(option);
    }
  }

  // 🟣 Mostrar loader mientras carga disponibilidad
  function mostrarLoader(mostrar) {
    if (mostrar) {
      horaSelect.innerHTML = '<option>Cargando disponibilidad...</option>';
      horaSelect.disabled = true;
    } else {
      horaSelect.disabled = false;
    }
  }

  // 🧠 Configurar fecha mínima = hoy
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  fechaInput.min = `${yyyy}-${mm}-${dd}`;

  generarHoras();

  // 📅 Al cambiar la fecha, consultar disponibilidad
  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    if (!fecha) return;

    mostrarLoader(true);
    const cacheKey = `ocupadas_${fecha}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const horas = JSON.parse(cached);
      generarHoras(horas);
      mostrarLoader(false);
      console.log("📦 Usando caché:", horas);
      filtrarHorasPasadas();
      return;
    }

    try {
      const res = await fetch(`${proxyUrl}${googleScriptUrl}?fecha=${fecha}`);
      const data = await res.json();

      if (data.ocupadas && Array.isArray(data.ocupadas)) {
        localStorage.setItem(cacheKey, JSON.stringify(data.ocupadas));
        generarHoras(data.ocupadas);
      } else {
        generarHoras();
      }

      filtrarHorasPasadas(); // ⏱️ Filtra horas pasadas si es hoy

    } catch (err) {
      console.error("❌ Error al obtener disponibilidad:", err);
      alert("Error al verificar disponibilidad. Intenta nuevamente más tarde.");
      generarHoras();
    } finally {
      mostrarLoader(false);
    }
  });

  // ⏱️ Bloquear horas pasadas si la fecha es hoy
  function filtrarHorasPasadas() {
    const fechaSeleccionada = fechaInput.value;
    if (!fechaSeleccionada) return;

    const hoyStr = `${yyyy}-${mm}-${dd}`;
    if (fechaSeleccionada === hoyStr) {
      const ahora = new Date();
      const horaActual = ahora.getHours();

      [...horaSelect.options].forEach((opt) => {
        const h = parseInt(opt.value.split(":")[0]);
        if (h <= horaActual) {
          opt.disabled = true;
          opt.textContent += " (No disponible)";
        }
      });
    }
  }

  // 📤 Enviar cita
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const servicio = document.getElementById("servicio").value;
    const fecha = fechaInput.value;
    const hora = horaSelect.value;

    if (!nombre || !email || !servicio || !fecha || !hora) {
      alert("⚠️ Por favor completa todos los campos antes de enviar.");
      return;
    }

    if (horaSelect.selectedOptions[0].disabled) {
      alert("🚫 Esta hora no está disponible.");
      return;
    }

    form.querySelector("button[type='submit']").disabled = true;

    try {
      // ✉️ Enviar correo de confirmación
      await emailjs.send("service_tp0xzhi", "template_6csycq9", {
        to_name: nombre,
        to_email: email,
        servicio,
        fecha,
        hora,
      });

      // 🗓️ Crear evento en calendario
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
        alert("✅ Cita registrada correctamente.");
      } else {
        throw new Error(result.message || "Error al crear la cita.");
      }
    } catch (err) {
      console.error("❌ Error al enviar cita:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("❌ No se pudo registrar la cita. Intenta nuevamente.");
    } finally {
      form.querySelector("button[type='submit']").disabled = false;
    }
  });
});
