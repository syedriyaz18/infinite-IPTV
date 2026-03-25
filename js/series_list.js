import { fetchSeriesByCategory } from './streams.js';

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get("category_id");
  if (!categoryId) return;

  const series = await fetchSeriesByCategory(categoryId);
  const container = document.getElementById("series-list");

  series.forEach(item => {
    const card = document.createElement("div");
    card.className = "series-card";
    card.innerHTML = `
      <img src="${item.cover || 'images/series.png'}" alt="${item.name}" class="series-thumb"/>
      <p>${item.name}</p>
    `;
    card.onclick = () => window.location.href = `series.html?series_id=${item.series_id}`;
    container.appendChild(card);
  });
});
