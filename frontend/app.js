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
            "MX": {
                text: "Mail Exchange record, checks if a record is configured",
                link: "https://mxtoolbox.com/technical/mx-records"
            },
            "SPF": {
                text: "Sender Policy Framework, checks if a record is configured and is using hardfail (-all)",
                link: "https://dmarcian.com/spf/"
            },
            "DKIM": {
                text: "DomainKeys Identified Mail, checks if records for DKIM are configured",
                link: "https://dmarcian.com/dkim/"
            },
            "DMARC": {
                text: "Domain-based Message Authentication, Reporting and Conformance",
                link: "https://dmarc.org/"
            },
            "MTA-STS": {
                text: "Mail Transfer Agent Strict Transport Security, checks if a policy is configured",
                link: "https://datatracker.ietf.org/doc/html/rfc8461"
            },
            "DNSSEC": {
                text: "Domain Name System Security Extensions, checks if DNSSEC is enabled",
                link: "https://www.cloudflare.com/learning/dns/dnssec/"
            }
        };

        // Vul de tabel met de resultaten en tooltips
        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");
            typeCell.innerHTML = `
                <b class="tooltip" data-tooltip="${type}">
                    ${type}
                    <span class="tooltip-text">${tooltips[type].text} <a href="${tooltips[type].link}" target="_blank">Meer info</a></span>
                </b>`;
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

        // Extra informatie voor Nameservers en WHOIS
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
        alert("Something went wrong while looking up your domain..");
    } finally {
        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}

// Tooltip voor hover
document.addEventListener('mouseover', function (e) {
    if (e.target && e.target.classList.contains('tooltip')) {
        const tooltipText = e.target.querySelector('.tooltip-text');
        tooltipText.style.display = 'block';
    }
});

document.addEventListener('mouseout', function (e) {
    if (e.target && e.target.classList.contains('tooltip')) {
        const tooltipText = e.target.querySelector('.tooltip-text');
        tooltipText.style.display = 'none';
    }
});
