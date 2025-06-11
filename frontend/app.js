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
                text: "Mail Exchange record, checks if a record is configured. ",
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
                text: "Domain-based Message Authentication, Reporting and Conformance. ",
                link: "https://justinverstijnen.nl/enhance-email-security-with-spf-dkim-dmarc/#dmarc"
            },
            "MTA-STS": {
                text: "Mail Transfer Agent Strict Transport Security, checks if a policy is configured. ",
                link: "https://justinverstijnen.nl/what-is-mta-sts-and-how-to-protect-your-email-flow/"
            },
            "DNSSEC": {
                text: "Domain Name System Security Extensions, checks if DNSSEC is enabled. ",
                link: "https://justinverstijnen.nl/configure-dnssec-and-smtp-dane-with-exchange-online-microsoft-365/"
            }
        };

        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");

            typeCell.innerHTML = `
                <b class="tooltip">${type}
                    <span class="tooltip-text" data-tooltip="${type}">${tooltips[type].text} <a href="${tooltips[type].link}" target="_blank">Learn more</a></span>
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
        alert("An error occured. My apologies for the inconvenience.");
    } finally {
        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}
