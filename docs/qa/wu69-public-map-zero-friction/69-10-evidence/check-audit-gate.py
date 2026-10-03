import http.server
import json
import pathlib
import shutil
import subprocess
import threading
import tempfile

ROOT = pathlib.Path.cwd()  # Run from the repository root.
WORK = pathlib.Path(tempfile.mkdtemp(prefix='wu69-audit-gate-'))
OUT = pathlib.Path(__file__).resolve().parent
IDS = ['GHSA-86w9-cpqp-85rv', 'GHSA-vfj7-8cjw-p6xm']
baseline = json.loads((OUT / 'baseline.json').read_text())
results = []
requests = []
mode = 'expected-only'

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
        requests.append({'mode': mode, 'path': self.path, 'packages': list(body)})
        response = {}
        for advisory in baseline['advisories'].values():
            item = {k: v for k, v in advisory.items() if k != 'findings'}
            item['name'] = item['module_name']
            response.setdefault(item['name'], []).append(item)
        if mode in ('new-high', 'new-critical'):
            # Sentinel is synthetic test input, not an actual public advisory.
            item = dict(response['braces'][0])
            item.update(id=9999999, severity=mode.removeprefix('new-'),
                        github_advisory_id='GHSA-2222-3333-4444',
                        url='https://github.com/advisories/GHSA-2222-3333-4444',
                        title='SYNTHETIC SENTINEL: audit gate contract verification')
            response['braces'].append(item)
        data = json.dumps(response).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    def log_message(self, *args):
        pass

def audit(case, ignores, registry=None):
    folder = WORK / case
    folder.mkdir(exist_ok=True)
    for name in ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']:
        shutil.copy2(ROOT / name, folder / name)
    original_package = (folder / 'package.json').read_bytes()
    original_lock = (folder / 'pnpm-lock.yaml').read_bytes()
    cmd = ['pnpm', 'dlx', 'pnpm@11.9.0', 'audit', '--prod', '--audit-level', 'high']
    if registry:
        cmd += ['--registry', registry]
    first = subprocess.run(cmd + [arg for ghsa in ignores for arg in ('--ignore', ghsa)] + ['--json'], cwd=folder, capture_output=True, text=True, timeout=60)
    second = subprocess.run(cmd + ['--json'], cwd=folder, capture_output=True, text=True, timeout=60)
    (OUT / (case + '-registration.log')).write_text(first.stdout + first.stderr)
    (OUT / (case + '-audit.json')).write_text(second.stdout + second.stderr)
    result = {'case': case, 'pnpm': '11.9.0', 'ignores': ignores,
              'registrationExit': first.returncode, 'auditExit': second.returncode,
              'packageUnchanged': original_package == (folder / 'package.json').read_bytes(),
              'lockUnchanged': original_lock == (folder / 'pnpm-lock.yaml').read_bytes()}
    results.append(result)
    print(json.dumps(result), flush=True)
    assert result['registrationExit'] == 0
    assert result['packageUnchanged'] and result['lockUnchanged']
    assert result['auditExit'] == (0 if case in ('live-both', 'expected-only') else 1), result

audit('live-both', IDS)
audit('live-forge-only', IDS[:1])
audit('live-braces-only', IDS[1:])
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    for mode in ['expected-only', 'new-high', 'new-critical']:
        audit(mode, IDS, 'http://127.0.0.1:' + str(server.server_port))
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'gate-results.json').write_text(json.dumps(results, indent=2) + '\n')
    (OUT / 'mock-registry-requests.json').write_text(json.dumps(requests, indent=2) + '\n')
