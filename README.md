# DNSMegaTool

DNSMegaTool is a lightweight and web-based domain DNS lookup and security inspection tool created by Justin Verstijnen. This tool has the focus on email security and scores your domain based on the configuration of those DNS records.

## Main features

The main features of this tool are:

- Lookup your domains' email security
	- MX
	- SPF
	- DKIM
	- DMARC
	- MTA-STS
	- DNSSEC
- Checks the actual configuration
- Scores you from 1-6 based on configuration and used policies
- Confetti party if scoring 6/6
	- Try the domain _justinverstijnen.nl_ for a demo
- WHOIS information about your domain
- Displays actual NS servers

### What the tool doesn't do

- Correct your incorrect configured records
- Cache or save the information in any way, refreshing means a new lookup

## Changelog/new features

New features to this tool are added when needed or if the tool is broken.

Feature request can be done by submitting issues into GitHub.

## Technical Architecture

- **Languages** : HTML, CSS, Javascript, Python
- **Platform** : Azure Static Web Apps
- **Runtime model** : Serverless
- **Architecture** : Stateless HTTP API
- **Dependencies** : Python, DNS, additional networking libraries

## Issues

Its possible to submit any issues using the GitHub issues system.

At this moment, this tool has no known issues.

## License

This project is licensed under the **GNU GPL v3.0**.

Use at your own risk. No guarantees or official support are provided.
