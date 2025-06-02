import azure.functions as func
import json

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def perform_dns_lookup(domain):
    result = {"domain": domain}

    # MX
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        result["MX"] = [str(r.exchange).rstrip('.') for r in answers]
    except:
        result["MX"] = []

    # SPF (via TXT)
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        spf_records = [r.to_text().strip('"') for r in answers if r.to_text().startswith('"v=spf1')]
        result["SPF"] = spf_records
    except:
        result["SPF"] = []

    # DKIM (we proberen standaard selector 'default')
    try:
        selector = 'default'
        dkim_domain = f"{selector}._domainkey.{domain}"
        answers = dns.resolver.resolve(dkim_domain, 'TXT')
        dkim_records = [r.to_text().strip('"') for r in answers]
        result["DKIM"] = {"record": dkim_records, "valid_selector": selector}
    except:
        result["DKIM"] = {"record": [], "valid_selector": None}

    # DMARC
    try:
        dmarc_domain = f"_dmarc.{domain}"
        answers = dns.resolver.resolve(dmarc_domain, 'TXT')
        dmarc_records = [r.to_text().strip('"') for r in answers]
        result["DMARC"] = dmarc_records
    except:
        result["DMARC"] = []

    # MTA-STS
    try:
        mta_domain = f"_mta-sts.{domain}"
        answers = dns.resolver.resolve(mta_domain, 'TXT')
        mta_records = [r.to_text().strip('"') for r in answers]
        result["MTA_STS"] = mta_records
    except:
        result["MTA_STS"] = []

    # DNSSEC (aanwezigheid DS record)
    try:
        answers = dns.resolver.resolve(domain, 'DS')
        ds_records = [r.to_text() for r in answers]
        result["DNSSEC"] = True
        result["DS"] = ds_records
    except:
        result["DNSSEC"] = False
        result["DS"] = []

    # NS Records
    try:
        answers = dns.resolver.resolve(domain, 'NS')
        result["NS"] = [str(r.target).rstrip('.') for r in answers]
    except:
        result["NS"] = []

    return result

@app.route(route="function_app")
def dns_megatool(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get("domain")
    if not domain:
        return func.HttpResponse("Please pass a domain parameter.", status_code=400)

    data = perform_dns_lookup(domain)
    return func.HttpResponse(json.dumps(data), mimetype="application/json")
