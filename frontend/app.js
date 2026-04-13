const API = window.location.origin + "/api";

const $ = (id) => document.getElementById(id);
const body = $("games-body");
const statusEl = $("refresh-status");

const fmtCLP = (n) =>
    n == null ? "" : "$" + Math.round(n).toLocaleString("es-CL");
const fmtUSD = (n) => (n == null ? "" : "$" + n.toFixed(2));

let currentFilters = {
    search: "",
    min_discount: 0,
    only_selected: false,
    hide_published: false,
    sort: "discount",
};

async function fetchGames() {
    const q = new URLSearchParams();
    if (currentFilters.search) q.set("search", currentFilters.search);
    if (currentFilters.min_discount)
        q.set("min_discount", currentFilters.min_discount);
    if (currentFilters.only_selected) q.set("only_selected", "true");
    if (currentFilters.hide_published) q.set("hide_published", "true");
    q.set("sort", currentFilters.sort);
    const r = await fetch(API + "/games?" + q.toString());
    if (!r.ok) throw new Error("Error cargando juegos");
    return r.json();
}

function renderGames(games) {
    $("count").textContent = `${games.length} juegos`;
    body.innerHTML = "";
    for (const g of games) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img class="thumb" src="${g.image_url || ""}" alt=""></td>
            <td class="name">
                <a href="${g.store_url}" target="_blank" rel="noopener">${escapeHtml(g.name)}</a>
                ${g.notes ? `<div style="color:var(--muted);font-size:11px">${escapeHtml(g.notes)}</div>` : ""}
            </td>
            <td>${escapeHtml(g.platforms || "")}</td>
            <td>
                ${g.price_original_usd != null && g.price_original_usd !== g.price_discounted_usd
                    ? `<s style="color:var(--muted)">${fmtUSD(g.price_original_usd)}</s> `
                    : ""}
                <strong>${fmtUSD(g.price_discounted_usd)}</strong>
            </td>
            <td><span class="discount-pill ${g.discount_percent ? "" : "zero"}">-${g.discount_percent}%</span></td>
            <td>${fmtCLP(g.cost_clp)}</td>
            <td class="price-clp">${fmtCLP(g.primaria_1)}</td>
            <td class="price-clp">${fmtCLP(g.primaria_2)}</td>
            <td class="price-clp">${fmtCLP(g.secundaria)}</td>
            <td>${g.discount_end_at ? g.discount_end_at.slice(0, 10) : ""}</td>
            <td><input type="checkbox" class="sel" ${g.selected ? "checked" : ""} data-id="${g.id}"></td>
            <td><input type="checkbox" class="pub" ${g.published ? "checked" : ""} data-id="${g.id}"></td>
        `;
        body.appendChild(tr);
    }
    bindRowEvents();
}

function escapeHtml(s) {
    return String(s).replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
}

function bindRowEvents() {
    body.querySelectorAll(".sel").forEach((el) =>
        el.addEventListener("change", async (e) => {
            const id = e.target.dataset.id;
            await fetch(API + "/games/" + id, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ selected: e.target.checked }),
            });
        })
    );
    body.querySelectorAll(".pub").forEach((el) =>
        el.addEventListener("change", async (e) => {
            const id = e.target.dataset.id;
            await fetch(API + "/games/" + id, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ published: e.target.checked }),
            });
        })
    );
}

async function reload() {
    try {
        const games = await fetchGames();
        renderGames(games);
    } catch (e) {
        statusEl.textContent = e.message;
    }
}

// Refresh button
$("btn-refresh").addEventListener("click", async () => {
    statusEl.textContent = "Actualizando...";
    try {
        const r = await fetch(API + "/refresh", { method: "POST" });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            statusEl.textContent =
                "Error: " + (err.detail?.message || err.detail || r.statusText);
            return;
        }
        const summary = await r.json();
        statusEl.textContent = `OK: ${summary.total_seen} vistos (${summary.new} nuevos, ${summary.updated} actualizados, ${summary.disappeared} fuera)`;
        await reload();
    } catch (e) {
        statusEl.textContent = "Error: " + e.message;
    }
});

// Export button
$("btn-export").addEventListener("click", () => {
    window.open(API + "/games/export.csv?only_selected=true", "_blank");
});

// Filters
$("search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value;
    reload();
});
$("min-discount").addEventListener("input", (e) => {
    currentFilters.min_discount = parseInt(e.target.value) || 0;
    reload();
});
$("only-selected").addEventListener("change", (e) => {
    currentFilters.only_selected = e.target.checked;
    reload();
});
$("hide-published").addEventListener("change", (e) => {
    currentFilters.hide_published = e.target.checked;
    reload();
});
$("sort").addEventListener("change", (e) => {
    currentFilters.sort = e.target.value;
    reload();
});

// Settings panel
$("btn-settings").addEventListener("click", async () => {
    const p = $("settings-panel");
    p.classList.toggle("hidden");
    if (!p.classList.contains("hidden")) {
        const s = await (await fetch(API + "/settings")).json();
        $("s-usd").value = s.usd_to_clp;
        $("s-fee").value = s.purchase_fee_pct;
        $("s-p1").value = s.primaria_1_mult;
        $("s-p2").value = s.primaria_2_mult;
        $("s-sec").value = s.secundaria_mult;
        $("s-round").value = s.round_to;
    }
});

$("btn-save-settings").addEventListener("click", async () => {
    const payload = {
        usd_to_clp: parseFloat($("s-usd").value),
        purchase_fee_pct: parseFloat($("s-fee").value),
        primaria_1_mult: parseFloat($("s-p1").value),
        primaria_2_mult: parseFloat($("s-p2").value),
        secundaria_mult: parseFloat($("s-sec").value),
        round_to: parseInt($("s-round").value),
    };
    const r = await fetch(API + "/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (r.ok) {
        $("settings-status").textContent = "Guardado";
        setTimeout(() => ($("settings-status").textContent = ""), 2000);
        reload();
    }
});

reload();
