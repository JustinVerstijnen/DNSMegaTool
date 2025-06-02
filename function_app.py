import azure.functions as func
import json
import os
import jinja2
import datetime

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def perform_dns_lookup(domain):
    return {
        "domain": domain,
        "MX": ["mx.example.com"],
        "SPF": ["v=spf1 include:_spf.example.com -all"],
        "DKIM": {"record": ["v=DKIM1; k=rsa; p=abc123"], "valid_selector": "selector1"},
        "DMARC": ["v=DMARC1; p=reject"],
        "MTA_STS": ["v=STSv1; id=2021062500"],
        "DNSSEC": True,
        "DS": ["12345 8 2 abcdef..."],
        "NS": ["ns1.example.com", "ns2.example.com"]
    }

@app.route(route="function_app")
def dns_megatool(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get("domain")
    export = req.params.get("export")

    if not domain:
        return func.HttpResponse("Please pass a domain parameter.", status_code=400)

    data = perform_dns_lookup(domain)

    if export:
        try:
            template_loader = jinja2.FileSystemLoader(
                searchpath=os.path.join(os.path.dirname(__file__), "website")
            )
            template_env = jinja2.Environment(loader=template_loader)

            rows = []
            def render_row(label, records, is_active=True):
                value = "<br>".join(records) if isinstance(records, list) else records
                row = {
                    "label": label,
                    "status_class": "enabled" if is_active else "disabled",
                    "status_icon": "✅" if is_active else "❌",
                    "value": value
                }
                rows.append(row)

            mx = data["MX"]
            spf = next((r for r in data["SPF"] if "v=spf1" in r), "No SPF record found")
            spf_strict = "-all" in spf
            dmarc = next((r for r in data["DMARC"] if "v=DMARC1" in r), "No DMARC record found")
            mta = next((r for r in data["MTA_STS"] if "v=STSv1" in r), "No MTA-STS record found")
            dkim = next((r for r in data["DKIM"]["record"] if "v=DKIM1" in r), "No DKIM record(s) found")
            dkim_valid = data["DKIM"]["valid_selector"] is not None
            dnssec = data["DNSSEC"]
            ds = data["DS"][0] if data["DS"] else "No DS record found"

            render_row("MX", mx, mx != [])
            render_row("SPF", spf, spf_strict)
            render_row("DKIM", dkim, dkim_valid)
            render_row("DMARC", dmarc, "p=reject" in dmarc)
            render_row("MTA-STS", mta, "v=STSv1" in mta)
            render_row("DNSSEC", ds, dnssec)

            template = template_env.get_template("export.html")
            html = template.render(
                domain=data["domain"],
                rows=rows,
                ns_records="<br>".join(data["NS"]),
                year=datetime.datetime.now().year
            )
            return func.HttpResponse(html, mimetype="text/html")

        except Exception as e:
            return func.HttpResponse(f"Template rendering failed: {str(e)}", status_code=500)

    return func.HttpResponse(json.dumps(data), mimetype="application/json")
