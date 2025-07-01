
let isLoading = false;
let hasLoadedOnce = false;

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
    const domain = document.getElementById("domainInput").value;
    const loaderBar = document.getElementById("loaderBar");
    const spinner = document.getElementById("spinner");
    const resultsSection = document.getElementById("resultsSection");
    const exportBtn = document.getElementById("exportBtn");
    const tbody = document.querySelector("#resultTable tbody");
    const extraInfo = document.getElementById("extraInfo");

    resultsSection.style.display = "none";
    exportBtn.style.display = "none";
    tbody.innerHTML = "";
    extraInfo.innerHTML = "";

    if (!hasLoadedOnce) {
        if (loaderBar) loaderBar.style.display = "block";
    } else {
        if (spinner) spinner.style.display = "inline-block";
    }

    try {
        const response = await fetch(`http://localhost:7071/api/check?domain=${encodeURIComponent(domain)}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();

        if (data.results) {
            data.results.forEach((entry) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.type}</td>
                    <td>${entry.value}</td>
                `;
                tbody.appendChild(row);
            });
        }

        if (data.extra) {
            extraInfo.innerHTML = `<pre>${data.extra}</pre>`;
        }

        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    } catch (error) {
        alert("Fout bij ophalen van gegevens: " + error.message);
        console.error(error);
    } finally {
        if (loaderBar) loaderBar.style.display = "none";
        if (spinner) spinner.style.display = "none";
        checkBtn.disabled = false;
        isLoading = false;
        hasLoadedOnce = true;
    }
}
