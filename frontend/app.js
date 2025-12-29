let isLoading = false;

const domainPattern = /^(?!\-)([a-zA-Z0-9\-]{1,63}(?<!\-)\.)+[a-zA-Z]{2,}$/;

document.addEventListener("DOMContentLoaded", function () {
    const domainInput = document.getElementById("domainInput");
    const checkBtn = document.getElementById("checkBtn");
    const bulkBtn = document.getElementById("bulkBtn");
    const exportBtn = document.getElementById("exportBtn");

    domainInput.focus();

    domainInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            if (isLoading) return;
            event.preventDefault();
            checkDomain();
        }
    });

    checkBtn.addEventListener("click", function (event) {
        event.preventDefault();
        checkDomain();
    });

    bulkBtn.addEventListener("click", function (event) {
        event.preventDefault();
        openBulkModal();
    });

    exportBtn.addEventListener("click", function (event) {
        event.preventDefault();
        exportHTML();
    });

    // Bulk modal buttons
    document.getElementById("bulkRunBtn").addEventListener("click", function (event) {
        event.preventDefault();
        runBulkFromModal();
    });
    document.getElementById("bulkCancelBtn").addEventListener("click", function (event) {
        event.preventDefault();
        closeBulkModal();
    });

    // Close modal when clicking backdrop
    document.getElementById("bulkModal").addEventListener("click", function (event) {
        if (event.target && event.target.id === "bulkModal") closeBulkModal();
    });
});

function sanitizeDomain(raw) {
    let d = (raw || "").trim();
    if (!d) return "";

    // Strip common copy/paste formats like https://example.com/path
    try {
        if (d.includes("://")) {
            const u = new URL(d);
            d = u.hostname || d;
        }
    } catch (_) {
        // ignore
    }

    // Strip path/query fragments if present (example.com/path)
    d = d.split("/")[0];

    // Strip trailing dot
    d = d.replace(/\.$/, "");

    return d.trim();
}

function parseDomains(text) {
    const lines = (text || "").split(/\r?\n/);
    const domains = [];
    const invalid = [];
    const seen = new Set();

    for (const line of lines) {
        const d = sanitizeDomain(line);
        if (!d) continue;

        if (!domainPattern.test(d)) {
            invalid.push(d);
            continue;
        }

        const key = d.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        domains.push(d);
    }

    return { domains, invalid };
}

function setLoadingState(loading) {
    isLoading = loading;

    const checkBtn = document.getElementById("checkBtn");
    const bulkBtn = document.getElementById("bulkBtn");
    const exportBtn = document.getElementById("exportBtn");
    const loader = document.getElementById("loader");

    checkBtn.disabled = loading;
    bulkBtn.disabled = loading;

    if (loading) {
        exportBtn.style.display = "none";
        loader.style.display = "flex";
    } else {
        loader.style.display = "none";
    }
}

function resetResultsUI() {
    const resultsSection = document.getElementById("resultsSection");
    const resultsContainer = document.getElementById("resultsContainer");
    const progressText = document.getElementById("progressText");

    resultsContainer.innerHTML = "";
    progressText.style.display = "none";
    progressText.textContent = "";
    resultsSection.style.display = "none";
}

async function fetchLookup(domain) {
    const response = await fetch(`/api/lookup?domain=${encodeURIComponent(domain)}`);
    if (!response.ok) {
        throw new Error(`Lookup failed (${response.status})`);
    }
    return await response.json();
}

function renderDomainResult(domain, data, container) {
    const block = document.createElement("div");
    block.className = "result-block";

    const title = document.createElement("h2");
    title.className = "domain-title";
    title.textContent = domain;
    block.appendChild(title);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "resultTable";

    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Type</th><th>Status</th><th>Value</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Records table (skip NS/WHOIS)
    for (const [type, record] of Object.entries(data || {})) {
        if (type === "NS" || type === "WHOIS") continue;

        const row = document.createElement("tr");

        const typeCell = document.createElement("td");
        typeCell.textContent = type;

        const statusCell = document.createElement("td");
        statusCell.textContent = record && record.status ? "✅" : "❌";

        const valueCell = document.createElement("td");
        const value = record ? record.value : "";
        if (Array.isArray(value)) {
            const list = document.createElement("ul");
            value.forEach(v => {
                const li = document.createElement("li");
                li.textContent = v;
                list.appendChild(li);
            });
            valueCell.appendChild(list);
        } else {
            valueCell.textContent = value;
        }

        row.appendChild(typeCell);
        row.appendChild(statusCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    }

    // If we got no usable records, show something
    if (!tbody.children.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="3">No results.</td>`;
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    block.appendChild(tableWrapper);

    // Extra info boxes
    const extra = document.createElement("div");
    extra.className = "extraInfo";
    extra.style.marginTop = "12px";

    if (data && data.NS) {
        const nsBox = document.createElement("div");
        nsBox.className = "infobox";
        nsBox.innerHTML = `<h3>Nameservers for ${domain}:</h3><ul>` +
            data.NS.map(ns => `<li>${ns}</li>`).join("") + "</ul>";
        extra.appendChild(nsBox);
    }

    if (data && data.WHOIS) {
        const whoisBox = document.createElement("div");
        whoisBox.className = "infobox";

        if (data.WHOIS.error) {
            whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3><p>${data.WHOIS.error}</p>`;
        } else {
            const registrar = data.WHOIS.registrar || "Not found";
            const creation = data.WHOIS.creation_date || "Not found";
            whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3>
                <ul>
                    <li>Registrar: ${registrar}</li>
                    <li>Date of Registration: ${creation}</li>
                </ul>`;
        }
        extra.appendChild(whoisBox);
    }

    if (extra.children.length) block.appendChild(extra);

    container.appendChild(block);

    // Confetti if all records (except NS/WHOIS) are green
    let allGreen = true;
    for (const [type, record] of Object.entries(data || {})) {
        if (type === "NS" || type === "WHOIS") continue;
        if (!record || !record.status) {
            allGreen = false;
            break;
        }
    }
    if (allGreen && typeof confetti === "function") {
        confetti({
            particleCount: 300,
            spread: 200,
            origin: { y: 0.6 }
        });
    }
}

function renderDomainError(domain, err, container) {
    const data = {
        ERROR: { status: false, value: (err && err.message) ? err.message : String(err) }
    };
    renderDomainResult(domain, data, container);
}

async function checkDomain() {
    if (isLoading) return;

    const domainInput = document.getElementById("domainInput");
    const domain = sanitizeDomain(domainInput.value);
    domainInput.value = domain;

    if (!domainPattern.test(domain)) {
        alert("The input does not appear to be a valid domain. Please check your entry.");
        return;
    }

    resetResultsUI();
    setLoadingState(true);

    const resultsSection = document.getElementById("resultsSection");
    const resultsContainer = document.getElementById("resultsContainer");
    const exportBtn = document.getElementById("exportBtn");

    try {
        const data = await fetchLookup(domain);
        renderDomainResult(domain, data, resultsContainer);

        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
        exportBtn.dataset.exportName = domain;
    } catch (e) {
        console.error(e);
        renderDomainError(domain, e, resultsContainer);
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
        exportBtn.dataset.exportName = domain;
    } finally {
        setLoadingState(false);
    }
}

/* ---------------- Bulk modal ---------------- */

function openBulkModal() {
    const modal = document.getElementById("bulkModal");
    const textarea = document.getElementById("bulkTextarea");
    textarea.value = "";
    modal.style.display = "flex";
    textarea.focus();
}

function closeBulkModal() {
    const modal = document.getElementById("bulkModal");
    modal.style.display = "none";
}

async function runBulkFromModal() {
    if (isLoading) return;

    const textarea = document.getElementById("bulkTextarea");
    const { domains, invalid } = parseDomains(textarea.value);

    if (invalid.length) {
        const preview = invalid.slice(0, 10).join("\n");
        alert(`These lines are not valid domains and will be skipped:\n\n${preview}${invalid.length > 10 ? "\n..." : ""}`);
    }

    if (!domains.length) {
        alert("No valid domains found.");
        return;
    }

    closeBulkModal();
    await runBulk(domains);
}

async function runBulk(domains) {
    resetResultsUI();
    setLoadingState(true);

    const resultsSection = document.getElementById("resultsSection");
    const resultsContainer = document.getElementById("resultsContainer");
    const progressText = document.getElementById("progressText");
    const exportBtn = document.getElementById("exportBtn");

    resultsSection.style.display = "block";
    progressText.style.display = "block";

    exportBtn.dataset.exportName = `bulk_${domains.length}_domains`;

    try {
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            progressText.textContent = `Checking ${i + 1}/${domains.length}: ${domain}`;

            try {
                const data = await fetchLookup(domain);
                renderDomainResult(domain, data, resultsContainer);
            } catch (e) {
                console.error(e);
                renderDomainError(domain, e, resultsContainer);
            }
        }

        progressText.textContent = `Done. Looked up ${domains.length} domain(s).`;
        exportBtn.style.display = "inline-block";
    } finally {
        setLoadingState(false);
    }
}

/* ---------------- Export ---------------- */

function exportHTML() {
    const resultsContainer = document.getElementById("resultsContainer");
    const progressText = document.getElementById("progressText");

    const exportName = (document.getElementById("exportBtn").dataset.exportName || "dnsmegatool_report")
        .replace(/[^a-zA-Z0-9_\-\.]/g, "_");

    const reportContent = `
        ${progressText && progressText.textContent ? `<div class="progress-text">${escapeHtml(progressText.textContent)}</div>` : ""}
        <div>${resultsContainer.innerHTML}</div>
    `;

    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DNS MEGAtool report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background:#f2f2f2; margin:0;padding:20px; }
        .container { background:#fff; padding:20px; border-radius:8px; max-width:900px; margin:auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        h1 { text-align:center; margin-top:10px; }
        .subtitle { text-align:center; font-size: 1em; color:#777; margin-bottom: 20px; }
        h2 { margin: 0 0 10px 0; }
        h3 { margin-top: 20px; }
        .table-wrapper { margin-top: 10px; overflow-x:auto; border-radius:10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); background:#fff; }
        table { width:100%; border-collapse: separate; border-spacing: 0; border-radius:10px; overflow:hidden; }
        thead { background-color:#f9f9f9; }
        th:nth-child(1), td:nth-child(1), th:nth-child(2), td:nth-child(2) { text-align:center; vertical-align:middle; }
        th, td { padding:15px; word-break:break-word; max-width:600px; text-align:left; vertical-align:top; }
        tbody tr:nth-child(even) { background-color: #f6f6f6; }
        ul { margin: 0; padding-left: 20px; }
        .infobox { background:#e0f0ff; padding:10px; border-radius:5px; margin-top:10px; border: 1px solid #aad; }
        .result-block { margin-top: 20px; padding-top: 10px; }
        .progress-text { margin-top: 10px; padding: 10px; background: #fff7e6; border: 1px solid #f3d19b; border-radius: 6px; color: #7a4b00; }
    </style>
</head>
<body>
<div class="container">
    <h1>DNS MEGAtool report</h1>
    <div class="subtitle">Report generated with <a href="https://dnsmegatool.justinverstijnen.nl" target="_blank" rel="noopener noreferrer">Justin Verstijnen DNS MEGAtool</a></div>
    ${reportContent}
</div>
</body>
</html>
    `;

    const blob = new Blob([template], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    return (str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
