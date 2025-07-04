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
    const exportBtn = 
document.getElementById("exportBtn").addEventListener("click", function () {
    const domain = document.getElementById("domainInput").value.trim();

    // Clone de resultTable zonder tooltips (verwijder title-attributen)
    const tableClone = document.querySelector("#resultTable").cloneNode(true);
    tableClone.querySelectorAll("[title]").forEach(el => el.removeAttribute("title"));

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
