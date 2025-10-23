// ✅ Inicializa EmailJS correctamente
(function() {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key (User ID)
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  // 🟣 URLs (proxy + tu script de Google)
  const proxyUrl = "https://corsproxy.io/?";
  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbxjujPdfdtbjJGYA1x8VAj1imftoUB121V1AP51EsXQVMbf8r7WWFksDbl98HtyJ5pZ_A/exec";

  // 🕓 Generar horarios dinámicamente según disponibilidad
  async function generarHoras(fechaSeleccionada) {
    horaSelect.innerHTML = '<option value="">Cargando horas...</option>';

    try {
      const res = await fetch(proxyUrl + googleScriptUrl + `?fecha=${fechaSeleccionada}`);
      const data = await res.json();
      const ocupadas = data.ocupadas || [];

      horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      for (let h = 8; h <= 17; h++) {
        const hora = `${h.toString().padStart(2, "0")}:00`;
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;

        if (ocupadas.includes(hora)) {
          option.disabled = true;
          option.textContent += " (No disponible)";
        }

        horaSelect.appendChild(option);
      }

    } catch (err) {
      console.error("❌ Error al obtener disponibilidad:", err);
      horaSelect.innerHTML = '<option value="">Error al cargar horas</option>';
    }
  }

  // 📅 Cuando cambia la fecha → actualizar horas
  fechaInput.addEventListener("change", (e) => {
    const fechaSeleccionada = e.target.value;
    if (fechaSeleccionada) generarHoras(fechaSeleccionada);
  });

  // 📤 Enviar formulario
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

    try {
      console.log("📧 Enviando correo con EmailJS...");

      // 📩 Enviar correo
      const emailResponse = await emailjs.send(
        "service_tp0xzhi",
        "template_6csycq9",
        {
          to_name: nombre,
          to_email: email,
          servicio,
          fecha,
          hora,
        }
      );
      console.log("✅ Correo enviado:", emailResponse.status, emailResponse.text);

      console.log("📆 Enviando cita al calendario...");

      const response = await fetch(proxyUrl + googleScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, servicio, fecha, hora }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        console.warn("⚠️ No se pudo leer la respuesta JSON del servidor (modo proxy).");
      }

      if (result.success === false && result.message === "Hora no disponible") {
        alert("❌ La hora seleccionada ya está ocupada. Por favor elige otra.");
        return;
      }

      console.log("✅ Cita enviada correctamente al calendario.");

      successMsg.style.display = "block";
      errorMsg.style.display = "none";
      form.reset();

    } catch (err) {
      console.error("❌ Error detallado:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("❌ Ocurrió un error al enviar la cita. Intenta de nuevo.");
    }
  });
});
