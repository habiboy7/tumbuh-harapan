document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("stuntingForm");
  const resultPanel = document.getElementById("resultPanel");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const age = form.umur.value.trim();
    const height = form.tinggi.value.trim();
    const genderRadio = form.querySelector(
      'input[name="jenisKelamin"]:checked'
    );

    if (Number(age) > 60) {
      resultPanel.innerHTML = `
    <div class="p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-900 text-center">
      <strong>Maaf!</strong> Tes ini hanya untuk anak usia 0–60 bulan.
    </div>
  `;
      return;
    }

    if (!genderRadio) {
      alert("Pilih jenis kelamin dulu ya!");
      return;
    }

    const genderText = genderRadio.value;
    const gender = genderText.toLowerCase() === "laki-laki" ? 1 : 0;

    if (!age || !height) {
      alert("Umur dan Tinggi harus diisi!");
      return;
    }

    const data = { age: Number(age), height: Number(height), gender: gender };

    // tampilkan loading responsive

    resultPanel.style.backgroundImage = "none";

    resultPanel.innerHTML = `
    <div class="flex flex-col items-center justify-center w-full h-full">
      <lottie-player
        src="/static/assets/loading.json"
        background="transparent"
        speed="8"
        class="w-40 h-40 md:w-52 md:h-52"
        loop
        autoplay>
      </lottie-player>
      <p class="mt-4 text-gray-900 font-semibold text-center">
        Memproses prediksi....
      </p>
    </div>
  `;

    const startTime = Date.now(); // catat mulai waktu

    try {
      const response = await fetch("/tes-stunting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resJson = await response.json();

      const elapsed = Date.now() - startTime;
      const minDelay = 1000; //
      const waitTime = elapsed < minDelay ? minDelay - elapsed : 0;

      setTimeout(() => {
        if (!response.ok) {
          resultPanel.innerHTML = `<p class="text-red-600 font-semibold">Error: ${
            resJson.error || "Terjadi kesalahan"
          }</p>`;
          return;
        }

        // Tentukan warna badge berdasarkan status
        let badgeColor = "";
        let badgeTextColor = "text-white";
        switch (resJson.status.toLowerCase()) {
          case "severely stunted":
            badgeColor = "bg-red-600";
            break;
          case "stunted":
            badgeColor = "bg-orange-500";
            break;
          case "normal":
            badgeColor = "bg-green-600";
            break;
          case "tinggi":
            badgeColor = "bg-blue-600";
            break;
          default:
            badgeColor = "bg-gray-500";
        }

        // --- BAGIAN INI UNTUK MEMPROSES SARAN GIZI ---
        const saranList = resJson.saran
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(/^\d+\.\s*/, "").trim());

        const saranHtml = `
      <ol class="list-decimal list-inside space-y-2 text-lg leading-relaxed text-blue-900">
        ${saranList.map((saranItem) => `<li>${saranItem}</li>`).join("")}
      </ol>
    `;
        // --- AKHIR BAGIAN PEMROSESAN ---
        resultPanel.innerHTML = `
        <div id="result-card" class="bg-card text-card-foreground rounded-lg h-fit">
            <div class="p-6 pb-0">
                <h3 class="text-2xl font-semibold leading-none tracking-tight flex items-center gap-3">
                    Hasil Prediksi
                    <span id="status-badge" class="inline-flex items-center rounded-full ${badgeColor} ${badgeTextColor} px-2 py-1 text-sm font-semibold">
                        ${resJson.status}
                    </span>
                </h3>
                <hr class="h-1 mt-3 bg-[#90D1CA] bg-opacity-30 rounded my-2">
            </div> 

            <div class="p-6 space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <p class="text-xl font-bold text-muted-foreground">Diagnosis</p>
                        <p id="probability" class="text-2xl font-semibold text-blue-600">
                            ${(resJson.probability * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xl font-bold text-muted-foreground">Status Gizi</p>
                        <p id="status-text" class="font-medium text-lg">${
                          resJson.status
                        }</p>
                    </div>
                </div>

                <div class="space-y-3 text-[#096B68] mt-8">
                    <h4 class="font-bold mt-2 text-xl">Informasi Detail</h4>
                    <div class="grid grid-cols-1 gap-3">
                        <div class="flex justify-between bg-[#90D1CA] bg-opacity-30 border border-[#90D1CA] items-center py-2 px-3 bg-muted/50 rounded-lg">
                            <span class="text-lg text-muted-foreground">Umur</span>
                            <span id="detail-age" class="font-medium">${
                              resJson.age
                            } bulan</span>
                        </div>
                        <div class="flex justify-between bg-[#90D1CA] bg-opacity-30 border border-[#90D1CA] items-center py-2 px-3 bg-muted/50 rounded-lg">
                            <span class="text-lg text-muted-foreground">Tinggi Badan</span>
                            <span id="detail-height" class="font-medium">${
                              resJson.height
                            } cm</span>
                        </div>
                        <div class="flex justify-between bg-[#90D1CA] bg-opacity-30 border border-[#90D1CA] items-center py-2 px-3 bg-muted/50 rounded-lg">
                            <span class="text-lg text-muted-foreground">Jenis Kelamin</span>
                            <span id="detail-gender" class="font-medium">${genderText}</span>
                        </div>
                    </div>
                </div>

                <div class="shrink-0 bg-border h-[1px] w-full"></div>

                <div class="space-y-3">
                    <h4 class="font-bold text-xl text-blue-900">Saran Gizi</h4>
                    <div class="p-4 text-lg text-justify bg-blue-50 border border-blue-200 rounded-lg">
                        ${saranHtml}
                    </div>
                </div>

                <div class="space-y-3">
                  <h4 class="font-bold text-xl text-orange-900">Penting !</h4>
                  <div class="flex px-4 py-2 text-lg text-justify text-orange-700 bg-orange-100 rounded-lg pt-4 border border-orange-200">
                      Hasil prediksi stunting dan saran gizi ini dibuat berdasarkan model kecerdasan buatan (AI) dan bertujuan sebagai informasi pencegahan dini stunting. Untuk memastikan kondisi dan penanganan yang sesuai, bawalah anak ke fasilitas kesehatan atau konsultasikan dengan ahli gizi.
                  </div>
                </div>
            </div>
        </div>
    `;
        form.reset();
      }, waitTime);
    } catch (error) {
      resultPanel.innerHTML = `<p class="text-red-600 font-semibold">Error: ${error.message}</p>`;
      console.error("Error:", error);
    }
  });
});

// ? Navbar
document.getElementById("menu-toggle").addEventListener("click", function () {
  const menu = document.getElementById("mobile-menu");
  menu.classList.toggle("hidden");
});

document.addEventListener("click", function (e) {
  const menu = document.getElementById("mobile-menu");
  const toggle = document.getElementById("menu-toggle");

  // Kalau menu sedang terbuka dan klik terjadi di luar menu & tombol toggle
  if (
    !menu.classList.contains("hidden") &&
    !menu.contains(e.target) &&
    !toggle.contains(e.target)
  ) {
    menu.classList.add("hidden");
  }
});

const nav = document.getElementById("main-nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    nav.classList.add("shadow-md");
  } else {
    nav.classList.remove("shadow-md");
  }
});

const cards = document.querySelectorAll(".card-info");
window.addEventListener("scroll", () => {
  const triggerHeight = window.innerHeight / 2;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const offset = rect.top - triggerHeight;
    if (offset < 0 && offset > -window.innerHeight) {
      card.style.transform = "scale(1)";
      card.style.zIndex = 30 - i;
    } else {
      card.style.transform = "scale(0.95)";
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const triggerText = document.getElementById("triggerHover");
  const glassCard = document.getElementById("glassCard");

  triggerText.addEventListener("mouseenter", () => {
    glassCard.classList.remove("hidden");
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  });

  triggerText.addEventListener("mouseleave", () => {
    glassCard.classList.add("hidden");
  });
});

const swiper = new Swiper(".mySwiper", {
  loop: true,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

// saran makanan sehat
const foods = [
  {
    name: "Telur",
    category: "Protein",
    desc: "Protein lengkap, kaya vitamin D",
    img: "/static/assets/food/telur.jpeg",
  },
  {
    name: "Ikan Salmon",
    category: "Protein",
    desc: "Omega-3, protein tinggi",
    img: "/static/assets/food/salmon.jpeg",
  },
  {
    name: "Daging Ayam",
    category: "Protein",
    desc: "Protein tanpa lemak, zat besi",
    img: "/static/assets/food/ayam.jpeg",
  },
  {
    name: "Susu",
    category: "Protein",
    desc: "Kalsium, vitamin D",
    img: "/static/assets/food/milk.jpeg",
  },
  {
    name: "Bayam",
    category: "Sayuran",
    desc: "Zat besi, folat, vitamin K",
    img: "/static/assets/food/bayam.jpeg",
  },
  {
    name: "Brokoli",
    category: "Sayuran",
    desc: "Vitamin C, serat, kalsium",
    img: "/static/assets/food/brokoli.jpeg",
  },
  {
    name: "Jeruk",
    category: "Buah",
    desc: "Vitamin C, antioksidan",
    img: "/static/assets/food/jeruk.jpeg",
  },
  {
    name: "Pisang",
    category: "Buah",
    desc: "Kalium, vitamin B6",
    img: "/static/assets/food/pisang.jpeg",
  },
];

const foodGrid = document.getElementById("foodGrid");

foods.forEach((food) => {
  const card = `
      <div class="bg-white rounded-xl  border border-2 overflow-hidden hover:shadow-md transition hover:shadow-orange-200">
        <div class="relative h-40">
          <img src="${food.img}" alt="${food.name}" class="w-full h-full object-cover">
          <span class="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-md">${food.category}</span>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900">${food.name}</h3>
          <p class="text-sm text-gray-600">${food.desc}</p>
        </div>
      </div>
    `;
  foodGrid.innerHTML += card;
});

// call action
function findNearby(query) {
  const alertBox = document.getElementById("alertBox");

  alertBox.innerText = "📍 Sedang mencari lokasi Anda...";
  alertBox.classList.remove("hidden");
  alertBox.classList.remove("bg-red-500");
  alertBox.classList.add("bg-green-500");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setTimeout(() => {
          alertBox.innerText = `✅ Lokasi ditemukan! Membuka Google Maps untuk ${query}...`;

          setTimeout(() => {
            window.open(
              `https://www.google.com/maps/search/${encodeURIComponent(
                query
              )}/@${lat},${lon},15z`,
              "_blank"
            );

            setTimeout(() => {
              alertBox.classList.add("opacity-0");
              setTimeout(() => {
                alertBox.classList.add("hidden");
                alertBox.classList.remove("opacity-0");
              }, 500);
            }, 2000);
          }, 1500);
        }, 2500);
      },
      () => {
        alertBox.innerText = "❌ Gagal mendapatkan lokasi. Pastikan GPS aktif.";
        alertBox.classList.replace("bg-green-500", "bg-red-500");

        setTimeout(() => {
          alertBox.classList.add("opacity-0");
          setTimeout(() => {
            alertBox.classList.add("hidden");
            alertBox.classList.remove("opacity-0");
          }, 500);
        }, 3000);
      }
    );
  } else {
    alertBox.innerText = "❌ Browser tidak mendukung geolokasi.";
    alertBox.classList.replace("bg-green-500", "bg-red-500");

    setTimeout(() => {
      alertBox.classList.add("opacity-0");
      setTimeout(() => {
        alertBox.classList.add("hidden");
        alertBox.classList.remove("opacity-0");
      }, 500);
    }, 3000);
  }
}
