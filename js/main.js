// ✅ Inicializa EmailJS correctamente
(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key (User ID)
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  // ✅ URL del Apps Script y proxy CORS
  const proxyUrl = "https://api.allorigins.win/raw?url=";
  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzBBgqVjHQJbOKZ1fFxvEsZLLYVQ2z1xSnMXnzuNX1kWdn_XK71iXrA1i3EYCGWT1vDYg/exec";

  // 🕓 Generar horarios de 8 AM a 5 PM
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

  generarHoras();

  // 📅 Ver disponibilidad al cambiar la fecha
  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    if (!fecha) return;

    console.log("📆 Verificando disponibilidad para:", fecha);

    try {
      const url = `${proxyUrl}${encodeURIComponent(`${googleScriptUrl}?fecha=${fecha}`)}`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("📋 Horas ocupadas:", data.ocupadas);

      generarHoras();

      // Deshabilitar las horas ocupadas
      if (data.ocupadas && Array.isArray(data.ocupadas)) {
        data.ocupadas.forEach((horaOcupada) => {
          const option = [...horaSelect.options].find(opt => opt.value === horaOcupada);
          if (option) {
            option.disabled = true;
            option.textContent += " (Ocupada)";
          }
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener disponibilidad:", err);
      alert("Error al verificar disponibilidad. Intenta más tarde.");
    }
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

    // ⛔ Verifica si la hora seleccionada está ocupada
    if (horaSelect.selectedOptions[0].disabled) {
      alert("🚫 Esta hora ya está ocupada. Elige otra disponible.");
      return;
    }

    try {
      console.log("📧 Enviando correo con EmailJS...");

      // 📩 Enviar correo con EmailJS
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

      // 📆 Enviar datos al Apps Script a través del proxy
      const citaData = { nombre, email, servicio, fecha, hora };
      const postUrl = `${proxyUrl}${encodeURIComponent(googleScriptUrl)}`;

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(citaData),
      });

      console.log("✅ Cita enviada al calendario mediante proxy CORS.");

      successMsg.style.display = "block";
      errorMsg.style.display = "none";
      form.reset();
      generarHoras();

    } catch (err) {
      console.error("❌ Error detallado:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("❌ Ocurrió un error al enviar la cita. Intenta de nuevo.");
    }
  });
});
