
async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
    const loader = document.getElementById("loader");
    const resultsSection = document.getElementById("resultsSection");
    const exportBtn = document.getElementById("exportBtn");
    const tbody = document.querySelector("#resultTable tbody");
    const extraInfo = document.getElementById("extraInfo");

    tbody.innerHTML = "";
    extraInfo.innerHTML = "";
    resultsSection.style.display = "none";
    exportBtn.style.display = "none";
    loader.style.display = "flex";

    try {
        const response = await fetch(`/api/lookup?domain=${domain}`);
        const data = await response.json();

        const tooltips = {
            "MX": "Mail Exchange record used to route emails.",
            "SPF": "Sender Policy Framework: prevents spoofing.",
            "DKIM": "DomainKeys Identified Mail: verifies message integrity.",
            "DMARC": "Domain-based Message Authentication Reporting and Conformance.",
            "MTA-STS": "Mail Transfer Agent Strict Transport Security.",
            "DNSSEC": "Domain Name System Security Extensions."
        };

        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");
            typeCell.innerHTML = `<div class="tooltip"><b>${type}</b><span class="tooltiptext">${tooltips[type] || ""}</span></div>`;
            const statusCell = document.createElement("td");
            statusCell.textContent = record.status ? "✅" : "❌";

            const valueCell = document.createElement("td");
            if (Array.isArray(record.value)) {
                const list = document.createElement("ul");
                record.value.forEach(val => {
                    const li = document.createElement("li");
                    li.textContent = val;
                    list.appendChild(li);
                });
                valueCell.appendChild(list);
            } else {
                valueCell.textContent = record.value;
            }

            row.appendChild(typeCell);
            row.appendChild(statusCell);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }

        if (data.NS) {
            const nsBox = document.createElement("div");
            nsBox.className = "infobox";
            nsBox.innerHTML = `<h3>Nameservers for ${domain}:</h3><ul>` +
                data.NS.map(ns => `<li>${ns}</li>`).join("") + "</ul>";
            extraInfo.appendChild(nsBox);
        }

        if (data.WHOIS) {
            const whoisBox = document.createElement("div");
            whoisBox.className = "infobox";
            if (data.WHOIS.error) {
                whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3><p>${data.WHOIS.error}</p>`;
            } else {
                const registrar = data.WHOIS.registrar || 'Not found';
                const creation = data.WHOIS.creation_date || 'Not found';
                whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3>
                <ul>
                    <li>Registrar: ${registrar}</li>
                    <li>Date of Registration: ${creation}</li>
                </ul>`;
            }
            extraInfo.appendChild(whoisBox);
        }

    } catch (e) {
        console.error(e);
        alert("Er is iets misgegaan tijdens de lookup.");
    } finally {
        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}

async function exportHTML() {
    const domain = document.getElementById("domainInput").value;
    const reportSection = document.getElementById("resultsSection").innerHTML;

    const templateResponse = await fetch("export-template.html");
    let template = await templateResponse.text();
    template = template.replaceAll("{{domain}}", domain).replace("{{report_content}}", reportSection);

    // Strip alle tooltip divs uit de export zodat alleen de type tekst overblijft
    template = template.replace(/<div class="tooltip"><b>(.*?)<\/b><span class="tooltiptext">.*?<\/span><\/div>/g, '<b>$1</b>');

    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "dns-megatool-report.html";
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById("domainInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        document.getElementById("checkBtn").click();
    }
});
