let isLoading = false;
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("domainInput").focus();

    document.getElementById("domainInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            if (isLoading) return;
            event.preventDefault();
            checkDomain();
        }
    });

    document.getElementById("checkBtn").addEventListener("click", function(event) {
        event.preventDefault();
        checkDomain();
    });
});

async function checkDomain() {
    isLoading = true;
    const checkBtn = document.getElementById("checkBtn");
    checkBtn.disabled = true;
    
    let domain = document.getElementById("domainInput").value.trim();
    document.getElementById("domainInput").value = domain;

    const domainPattern = /^(?!\-)([a-zA-Z0-9\-]{1,63}(?<!\-)\.)+[a-zA-Z]{2,}$/;
    if (!domainPattern.test(domain)) {
        alert("The input does not appear to be a valid domain. Please check your entry.");
        isLoading = false;
        checkBtn.disabled = false;
        return;
    }

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

    if (!domain) {
        alert("Please enter a valid domain.");
        return;
    }

    try {
        const response = await fetch(`/api/lookup?domain=${domain}`);
        const data = await response.json();

        const tooltips = {
            "MX": {
                text: "Mail Exchange record, checks if a MX record is configured. ",
                link: "https://justinverstijnen.nl/enhance-email-security-with-spf-dkim-dmarc/#mx"
            },
            "SPF": {
                text: "Sender Policy Framework, checks if a record is configured and is using hardfail (-all). ",
                link: "https://justinverstijnen.nl/enhance-email-security-with-spf-dkim-dmarc/#spf"
            },
            "DKIM": {
                text: "DomainKeys Identified Mail, checks if records for DKIM are configured. ",
                link: "https://justinverstijnen.nl/enhance-email-security-with-spf-dkim-dmarc/#dkim"
            },
            "DMARC": {
                text: "Domain-based Message Authentication, Reporting and Conformance. Checks if a DMARC record is configured and is using Reject as policy. ",
                link: "https://justinverstijnen.nl/enhance-email-security-with-spf-dkim-dmarc/#dmarc"
            },
            "MTA-STS": {
                text: "Mail Transfer Agent Strict Transport Security, checks if a policy is configured and published through HTTPS. ",
                link: "https://justinverstijnen.nl/what-is-mta-sts-and-how-to-protect-your-email-flow/"
            },
            "DNSSEC": {
                text: "Domain Name System Security Extensions, checks if DNSSEC is enabled and signed for the domain. ",
                link: "https://justinverstijnen.nl/configure-dnssec-and-smtp-dane-with-exchange-online-microsoft-365/"
            }
        };

        // Vul de tabel met de resultaten en tooltips
        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");

            typeCell.innerHTML = `
                <b class="tooltip">${type}
                    <span class="tooltip-text" data-tooltip="${type}">${tooltips[type].text} <a href="${tooltips[type].link}" target="_blank">Click here to learn more</a></span>
                </b>
            `;

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

        // Confetti effect als alle records groen zijn
        let allGreen = true;
        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;
            if (!record.status) {
                allGreen = false;
                break;
            }
        }
        if (allGreen) {
            confetti({
                particleCount: 300,
                spread: 200,
                origin: { y: 0.6 }
            });
        }

        // Extra informatie voor Nameservers
        if (data.NS) {
            const nsBox = document.createElement("div");
            nsBox.className = "infobox";
            nsBox.innerHTML = `<h3>Nameservers for ${domain}:</h3><ul>` +
                data.NS.map(ns => `<li>${ns}</li>`).join("") + "</ul>";
            extraInfo.appendChild(nsBox);
        }

        // Extra informatie voor WHOIS
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
        alert("An error occurred. My apologies for the inconvenience.");
    } finally {
        loader.style.display = "none";
        checkBtn.disabled = false;
        isLoading = false;
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}

document.getElementById("exportBtn").addEventListener("click", function () {
    const table = document.querySelector("#resultTable");
    
    let domain = document.getElementById("domainInput").value.trim();
    document.getElementById("domainInput").value = domain;

    const domainPattern = /^(?!\-)([a-zA-Z0-9\-]{1,63}(?<!\-)\.)+[a-zA-Z]{2,}$/;
    if (!domainPattern.test(domain)) {
        alert("The input does not appear to be a valid domain. Please check your entry.");
        isLoading = false;
        checkBtn.disabled = false;
        return;
    }

    let tableHTML = "";

    if (table) {
        // Clone the table to avoid modifying the original
        const clone = table.cloneNode(true);

        // Remove all tooltip spans
        clone.querySelectorAll(".tooltip").forEach(el => el.remove());

        // Get outer HTML without tooltip elements
        tableHTML = clone.outerHTML;
    }

    fetch("export-template.html")
        .then(response => response.text())
        .then(template => {
            template = template.replace("{{domain}}", domain);
            template = template.replace("{{report_content}}", tableHTML);

            const blob = new Blob([template], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", domain + "_dns_report.html");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        });
});



document.getElementById("exportBtn").addEventListener("click", function () {
    const domain = document.getElementById("domainInput").value.trim();
    const reportContent = `
        <h3>Scan results</h3>
        <table>${document.querySelector("#resultTable").innerHTML}</table>
        ${document.getElementById("extraInfo").outerHTML}
    `;

    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DNS MEGAtool report for ${domain}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background:#f2f2f2; margin:0;padding:20px; }
        .container { background:#fff; padding:20px; border-radius:8px; max-width:900px; margin:auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        h1 { text-align:center; margin-top:10px; font-family: 'Segoe UI', sans-serif; }
        .subtitle { text-align:center; font-size: 1em; color:#777; margin-bottom: 20px; font-family: 'Segoe UI', sans-serif; }
        h3 { margin-top:20px; font-family: 'Segoe UI', sans-serif; }
        table { width:100%; border-collapse: separate; border-spacing: 0; border-radius:10px; overflow:hidden; margin-top:20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        thead { background-color:#f9f9f9; }
        th:nth-child(1), td:nth-child(1), th:nth-child(2), td:nth-child(2) { text-align:center; vertical-align:middle; }
        th, td { padding:15px; word-break:break-word; max-width:600px; }
        tbody tr:nth-child(even) { background-color: #f6f6f6; }
        .infobox { background:#e0f0ff; padding:10px; border-radius:5px; margin-top:10px; border: 1px solid #aad; font-family: 'Segoe UI', sans-serif; }
    </style>
</head>
<body>
<div class="container">
    <h1>DNS MEGAtool report for ${domain}</h1>
    <div class="subtitle">Report generated with <a href="https://dnsmegatool.justinverstijnen.nl" target="_blank">Justin Verstijnen DNS MEGAtool</a></div>
    ${reportContent}
</div>
</body>
</html>
    `;

    const blob = new Blob([template], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `dnsmegatool_report_${domain}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


document.getElementById("exportBtn").addEventListener("click", function () {
    const domain = document.getElementById("domainInput").value.trim();

    // Clone de resultTable zonder tooltips (alleen tekst tonen)
    const tableClone = document.querySelector("#resultTable").cloneNode(true);
    tableClone.querySelectorAll(".tooltip").forEach(el => {
        const plainText = el.textContent.trim();
        const span = document.createElement("span");
        span.textContent = plainText;
        el.replaceWith(span);
    });

    const reportContent = `
        <table>${tableClone.innerHTML}</table>
        ${document.getElementById("extraInfo").outerHTML}
    `;

    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DNS MEGAtool report for ${domain}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background:#f2f2f2; margin:0;padding:20px; }
        .container { background:#fff; padding:20px; border-radius:8px; max-width:900px; margin:auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        h1 { text-align:center; margin-top:10px; font-family: 'Segoe UI', sans-serif; }
        .subtitle { text-align:center; font-size: 1em; color:#777; margin-bottom: 20px; font-family: 'Segoe UI', sans-serif; }
        table { width:100%; border-collapse: separate; border-spacing: 0; border-radius:10px; overflow:hidden; margin-top:20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        thead { background-color:#f9f9f9; }
        th, td { padding:15px; word-break:break-word; max-width:600px; text-align: center; }
        tbody tr:nth-child(even) { background-color: #f6f6f6; }
        .infobox { background:#e0f0ff; padding:10px; border-radius:5px; margin-top:10px; border: 1px solid #aad; font-family: 'Segoe UI', sans-serif; }
    </style>
</head>
<body>
<div class="container">
    <h1>DNS MEGAtool report for ${domain}</h1>
    <div class="subtitle">Report generated with <a href="https://dnsmegatool.justinverstijnen.nl" target="_blank">Justin Verstijnen DNS MEGAtool</a></div>
    ${reportContent}
</div>
</body>
</html>
    `;

    const blob = new Blob([template], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `dnsmegatool_report_${domain}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
