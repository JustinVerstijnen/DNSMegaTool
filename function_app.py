
import logging
import azure.functions as func
import json
import dns.resolver
import dns.dnssec
import dns.name
import dns.query
import dns.message

def query_dns_record(domain, record_type, selector=None):
    try:
        query_domain = domain
        if selector:
            query_domain = f"{selector}._domainkey.{domain}"

        if record_type == "SPF":
            answers = dns.resolver.resolve(domain, 'TXT')
            spf_records = [rdata.to_text().strip('"') for rdata in answers if rdata.to_text().startswith('"v=spf1')]
            return spf_records if spf_records else [f"SPF record not found for {domain}"]
        elif record_type == "DKIM":
            answers = dns.resolver.resolve(query_domain, 'TXT')
            return [rdata.to_text().strip('"') for rdata in answers]
        elif record_type == "DMARC":
            query_domain = f"_dmarc.{domain}"
            answers = dns.resolver.resolve(query_domain, 'TXT')
            return [rdata.to_text().strip('"') for rdata in answers]
        elif record_type == "MTA-STS":
            query_domain = f"_mta-sts.{domain}"
            answers = dns.resolver.resolve(query_domain, 'TXT')
            return [rdata.to_text().strip('"') for rdata in answers]
        else:
            answers = dns.resolver.resolve(query_domain, record_type)
            return [rdata.to_text() for rdata in answers]
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        return [f"{record_type} record not found for {query_domain}"]
    except Exception as e:
        return [f"Error while querying {record_type}: {str(e)}"]

def check_dnssec(domain):
    try:
        n = dns.name.from_text(domain)
        request = dns.message.make_query(n, dns.rdatatype.DNSKEY, want_dnssec=True)
        response = dns.query.udp(request, '8.8.8.8', timeout=5)
        if response.flags & dns.flags.AD:
            return ["DNSSEC is enabled"]
        elif response.answer:
            return [r.to_text() for r in response.answer[0]]
        else:
            return [f"DNSSEC record not found for {domain}"]
    except Exception as e:
        return [f"Error while querying DNSSEC: {str(e)}"]

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing DNSMegaTool request.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    domain = req_body.get('domain')
    if not domain:
        return func.HttpResponse("Please pass a domain in the request body", status_code=400)

    result = {
        "A": query_dns_record(domain, "A"),
        "MX": query_dns_record(domain, "MX"),
        "SPF": query_dns_record(domain, "SPF"),
        "DKIM_selector1": query_dns_record(domain, "DKIM", "selector1"),
        "DKIM_selector2": query_dns_record(domain, "DKIM", "selector2"),
        "DMARC": query_dns_record(domain, "DMARC"),
        "MTA-STS": query_dns_record(domain, "MTA-STS"),
        "DNSSEC": check_dnssec(domain)
    }

    return func.HttpResponse(json.dumps(result), mimetype="application/json")
