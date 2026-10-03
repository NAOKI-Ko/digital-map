import json,pathlib,subprocess,tempfile
root=pathlib.Path.cwd()
out=pathlib.Path(__file__).resolve().parent
workflow=(root/'.github/workflows/verify.yml').read_text()
script=workflow.split('      - run: |\n',1)[1].split('      - run: pnpm prisma:validate',1)[0]
script='\n'.join(line[10:] for line in script.splitlines())
results=[]
for date,expect in [('2026-11-01',0),('2026-11-02',0),('2026-11-03',1),('2026-12-01',1),('clock-error',42)]:
 date_fn='date() { return 42; }' if date=='clock-error' else 'date() { echo '+date+'; }'
 stub='pnpm() { echo AUDIT_CALL "$@"; }'
 p=subprocess.run(['bash','-e','-o','pipefail','-c',date_fn+'\n'+stub+'\n'+script],text=True,capture_output=True)
 calls=[line for line in p.stdout.splitlines() if line.startswith('AUDIT_CALL')]
 result={'utcDate':date,'exit':p.returncode,'auditCalls':calls,'stderr':p.stderr.strip()}
 assert p.returncode==expect,result
 assert len(calls)==(2 if expect==0 else 0),result
 results.append(result)
(out/'expiry-results.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
