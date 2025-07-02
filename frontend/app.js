
let isLoading = false;
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("domainInput").focus();

    document.getElementById("domainInput").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            if (isLoading) return;
            event.preventDefault();
            checkDomain();
        }
    });

    document.getElementById("checkBtn").addEventListener("click", function (event) {
        event.preventDefault();
        checkDomain();
    });

    document.getElementById("exportBtn").addEventListener("click", function () {
        exportResults();
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

    // Dummy example result
    const resultData = [
        { type: "MX", status: true, value: "jvapp-nl.m-v1.mx.microsoft." },
        { type: "SPF", status: true, value: "v=spf1 include:spf.protection.outlook.com -all" },
        { type: "DKIM", status: true, value: "selector1: v=DKIM1; k=rsa; ..." },
        { type: "DMARC", status: true, value: "v=DMARC1; p=reject; rua=mailto:reports@..." },
        { type: "STS", status: false, value: "v=STS1; id=202506060T000000Z" }
    ];

    window.latestResultData = resultData;
    window.latestDomain = domain;

    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";
    resultData.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.type}</td>
            <td>${record.status ? "✅" : "❌"}</td>
            <td>${record.value}</td>
        `;
        tbody.appendChild(row);
    });

    isLoading = false;
    checkBtn.disabled = false;
    document.getElementById("resultsSection").style.display = "block";
}

async function exportResults() {
    const domain = window.latestDomain || "unknown";
    const records = window.latestResultData || [];

    const response = await fetch("frontend/export-template.html");
    let template = await response.text();

    const rows = records.map(record => `
        <tr>
            <td>${record.type}</td>
            <td>${record.status ? "✅" : "❌"}</td>
            <td>${record.value}</td>
        </tr>
    `).join("");

    template = template.replace(/{{domain}}/g, domain).replace("{{rows}}", rows);

    const blob = new Blob([template], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dns-report-${domain}.html`;
    a.click();
    URL.revokeObjectURL(url);
}
