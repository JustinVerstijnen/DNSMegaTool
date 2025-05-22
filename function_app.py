import azure.functions as func
import dns.resolver
import json
from fpdf import FPDF
import io

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def get_txt_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'TXT')
        return [r.to_text().strip('"') for r in records]
    except Exception:
        return ["Not found"]

def get_ns_servers(domain):
    try:
        records = dns.resolver.resolve(domain, 'NS')
        return [str(r.target).strip('.') for r in records]
    except Exception:
        return ["Not found"]

def get_mx_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'MX')
        return [str(r.exchange).strip('.') for r in records]
    except Exception:
        return ["Not found"]

def get_ds_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'DS')
        return [r.to_text() for r in records]
    except Exception:
        return ["Not found"]

def check_dnskey_exists(domain):
    try:
        dns.resolver.resolve(domain, 'DNSKEY')
        return True
    except Exception:
        return False

class PDF(FPDF):
    def header(self):
        if hasattr(self, "logo_path"):
            self.image(self.logo_path, x=80, w=50)
            self.ln(25)
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, f"DNS MEGAtool Report – {self.domain}", ln=True, align="C")
        self.ln(5)

    def dns_table(self, data):
        self.set_font("Arial", "B", 12)
        self.set_fill_color(240, 240, 240)
        self.cell(60, 10, "Technology", 1, 0, 'C', True)
        self.cell(120, 10, "DNS Record", 1, 1, 'C', True)
        self.set_font("Arial", "", 11)
        for key in ["MX", "SPF", "DKIM", "DMARC", "MTA-STS", "DNSSEC"]:
            value = data.get(key, "Not found")
            self.multi_cell(180, 10, f"{key}: {value}", border=1)

    def ns_info(self, ns_list):
        self.ln(5)
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Authoritative Name Servers", ln=True)
        self.set_font("Arial", "", 11)
        for ns in ns_list:
            self.cell(0, 8, f"• {ns}", ln=True)

def generate_pdf(domain, data):
    pdf = PDF()
    pdf.domain = domain
    pdf.logo_path = "logo.png"  # pas dit pad aan indien anders
    pdf.add_page()
    pdf.dns_table(data)
    pdf.ns_info(data["NS"])

    pdf_stream = io.BytesIO()
    pdf.output(pdf_stream)
    pdf_stream.seek(0)
    return pdf_stream

@app.route(route="/", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def dns_mega_tool(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get('domain')
    export = req.params.get('export', "false").lower() == "true"

    if not domain:
        return func.HttpResponse(
            "Use /?domain=example.com to query DNS records or /?domain=example.com&export=true to get PDF.",
            mimetype="text/plain"
        )

    spf = get_txt_record(domain)
    dmarc = get_txt_record(f"_dmarc.{domain}")
    mta_sts = get_txt_record(f"_mta-sts.{domain}")
    ns = get_ns_servers(domain)
    ds = get_ds_record(domain)
    dnskey_exists = check_dnskey_exists(domain)
    dnssec = "✅" if dnskey_exists and ds != ["Not found"] else "❌"
    mx = get_mx_record(domain)

    dkim_selectors = ["selector1", "selector2", "default"]
    dkim_records = {"valid_selector": None, "record": ["Not found"]}
    for sel in dkim_selectors:
        full_name = f"{sel}._domainkey.{domain}"
        result = get_txt_record(full_name)
        if any("v=DKIM1" in r for r in result):
            dkim_records = {"valid_selector": sel, "record": result}
            break

    result = {
        "domain": domain,
        "SPF": next((r for r in spf if "v=spf1" in r), "Not found"),
        "DMARC": next((r for r in dmarc if "v=DMARC1" in r), "Not found"),
        "MTA-STS": next((r for r in mta_sts if "v=STSv1" in r), "Not found"),
        "DKIM": next((r for r in dkim_records["record"] if "v=DKIM1" in r), "Not found"),
        "DNSSEC": dnssec,
        "MX": ", ".join(mx) if mx else "Not found",
        "NS": ns
    }

    if export:
        pdf_stream = generate_pdf(domain, result)
        headers = {
            "Content-Disposition": f"attachment; filename=dns_megatool_{domain}.pdf"
        }
        return func.HttpResponse(pdf_stream.read(), mimetype="application/pdf", headers=headers)

    return func.HttpResponse(
        json.dumps(result, indent=2),
        mimetype="application/json"
    )
