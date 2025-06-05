
import dns.resolver

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
        return ["No MX record found"]

def get_ds_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'DS')
        return [r.to_text() for r in records]
    except Exception:
        return ["No DS record found or domain does not support DNSSEC."]

def check_dnskey_exists(domain):
    try:
        dns.resolver.resolve(domain, 'DNSKEY')
        return True
    except Exception:
        return False
