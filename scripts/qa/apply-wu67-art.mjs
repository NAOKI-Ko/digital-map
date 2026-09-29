/** WU-67 scoped QA art installation. No credentials, auth changes or schema changes. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { hostname } from 'node:os'
import { resolve, basename } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '../..')
const assets = resolve(root, 'assets/visitor-maps/nagoya-aquarium')
const applying = process.argv.includes('--apply')
const digest = value => createHash('sha256').update(value).digest('hex')
const sorted = value => Array.isArray(value) ? value.map(sorted).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k,sorted(value[k])])) : value
const stable = value => JSON.stringify(sorted(JSON.parse(JSON.stringify(value))))
const omit = (object, names) => Object.fromEntries(Object.entries(object).filter(([name]) => !names.includes(name)))
const floorFields = ['illustrationUrl','illustrationAssetId','imageWidth','imageHeight']
const spotFields = ['x','y','pinSourceMode','pinSourceCategoryId','pinIconType','pinIconId','pinIconImageUrl','pinIconAssetId','pinColor','pinSize']
const pick = (object, names) => Object.fromEntries(names.map(name => [name,object[name]]))
const include = { currentRelease: { select: { createdBy:true } }, categories:true, floors: { include: { decorations:true, spots: { include: { spotCategories:true, photos:true, fieldValues:true, translations:true, fieldValueTranslations:true } } } } }
function invariant(map, removed) {
 return stable({map:omit(map,['updatedAt','currentReleaseId','currentRelease','floors']),floors:map.floors.map(f=>({...omit(f,[...floorFields,'updatedAt','spots','decorations']),decorations:f.decorations.filter(d=>!removed.includes(d.id)),spots:f.spots.map(s=>omit(s,[...spotFields,'updatedAt','liveVersion']))}))})
}
function publicInvariant(map) {
 return stable({id:map.id,floors:map.floors.map(f=>({id:f.id,name:f.name,spots:f.spots.map(s=>({...omit(s,['x','y','pinIconType','pinIconId','pinIconImageUrl','pinColor']),photos:s.photos.map(p=>basename(p))}))}))})
}
async function main() {
 assert.notEqual(process.env.DEPLOYMENT_ENV,'production','Production is forbidden')
 assert.equal(process.env.DEPLOYMENT_ENV,'qa','Explicit QA environment required')
 assert.ok(process.env.DATABASE_URL,'Explicit DATABASE_URL required')
 const db = new URL(process.env.DATABASE_URL)
 assert.ok(['localhost','127.0.0.1'].includes(db.hostname),'Only local DB on the selected QA host is permitted')
 const rehearsal = process.env.WU67_TARGET === 'rehearsal'
 const rollbackProbe = process.argv.includes('--rehearsal-fail-after-draft')
 if(rollbackProbe) assert.equal(rehearsal,true,'Failure probe is forbidden on QA')
 if (rehearsal) assert.match(db.pathname,/^\/digital_map_test_wu67_[a-z0-9_]+$/)
 else {
  assert.equal(process.env.WU67_TARGET,'windows-qa')
  assert.equal(process.platform,'win32');assert.equal(hostname().toUpperCase(),'CHIFFONCHAN')
  assert.equal(db.pathname,'/digital_map')
 }
 assert.equal(process.env.PUBLIC_STORAGE_DRIVER,'local','QA uses isolated local public storage')
 assert.ok(process.env.PUBLIC_STORAGE_ROOT && process.env.UPLOAD_DIR && process.env.WU67_BACKUP_DIR,'Explicit QA storage and backup paths required')
 if (applying) assert.equal(process.env.WU67_APPLY,'WU67_AQUARIUM_QA_ONLY')
 const backup = resolve(process.env.WU67_BACKUP_DIR)
 const plan = JSON.parse(await readFile(resolve(assets,'integration-plan.json'),'utf8'))
 assert.equal(plan.mapId,'cmukrf4gz0007c8vawtaeozwn');assert.equal(plan.slug,'nagoya-aquarium-uat-20260928')
 assert.equal(plan.gateCommit,'3dc7771');assert.equal(plan.floors.length,5)
 assert.equal(plan.floors.flatMap(f=>f.spots).length,37)
 assert.equal(JSON.parse(await readFile(resolve(assets,'north-2f-layout.json'),'utf8')).gate,'ACCEPTED')
 const files = new Map()
 for (const f of plan.floors) {
  for (const spec of [{file:f.image,sha:f.sha256,width:f.imageWidth,height:f.imageHeight},...f.spots.filter(s=>s.icon).map(s=>({file:s.icon,sha:s.iconSha256,width:128,height:128}))]) {
   assert.match(spec.file,/^(?:icons\/)?[a-z0-9-]+\.png$/)
   const bytes = await readFile(resolve(assets,spec.file));assert.equal(digest(bytes),spec.sha,`Asset drift: ${spec.file}`)
   const md = await sharp(bytes).metadata();assert.equal(md.width,spec.width);assert.equal(md.height,spec.height)
   files.set(spec.sha,{...spec,bytes})
  }
  for (const s of f.spots) assert.ok(Number.isFinite(s.x)&&Number.isFinite(s.y)&&s.x>=0&&s.x<=1&&s.y>=0&&s.y<=1,'Invalid normalized placement')
 }
 const { prisma } = await import('../../server/utils/prisma.ts')
 const { processMediaAsset } = await import('../../server/utils/media-variants.ts')
 const { buildPublicRelease,activatePublicRelease,loadCurrentPublicSnapshot } = await import('../../server/utils/public-release.ts')
 const { getPublicStorage } = await import('../../server/utils/public-storage.ts')
 const { appendAuditEvent } = await import('../../server/utils/audit.ts')
 let before, applied, release
 const getMap = client => client.map.findUniqueOrThrow({where:{id:plan.mapId},include})
 try {
  before = await getMap(prisma)
  assert.equal(before.slug,plan.slug);assert.equal(before.currentReleaseId,plan.expectedReleaseId,'Public release drift')
  assert.equal(before.isPublished,true);assert.equal(before.floors.length,5);assert.equal(before.categories.length,6)
  const spotIds = []
  for (const f of plan.floors) {
   const old = before.floors.find(v=>v.id===f.id);assert.ok(old);assert.equal(old.name,f.name)
   for (const name of ['refAImageX','refAImageY','refALat','refALng','refBImageX','refBImageY','refBLat','refBLng']) assert.equal(old[name],null,'Unexpected georeference: manual review required')
   assert.deepEqual(old.spots.map(s=>s.id).sort(),f.spots.map(s=>s.id).sort())
   for(const s of f.spots) {
    const source = old.spots.find(v=>v.id===s.id);assert.equal(source.name,s.name);assert.equal(source.tenantId,before.tenantId);assert.equal(source.isPublished,true)
    assert.deepEqual(source.spotCategories.map(c=>c.categoryId).sort(),s.categoryIds);spotIds.push(s.id)
   }
  }
  const decs = before.floors.flatMap(f=>f.decorations)
  assert.deepEqual(decs.map(d=>d.id).sort(),plan.removeQaDecorationIds.toSorted(),'Unexpected decoration data')
  assert.equal(await prisma.spotRevision.count({where:{spotId:{in:spotIds},status:'PENDING'}}),0,'Pending editorial work requires reconciliation')
  const storage = getPublicStorage()
  const publicBefore = await loadCurrentPublicSnapshot(plan.slug,'ja',storage)
  assert.ok(publicBefore);assert.equal(publicBefore.releaseId,plan.expectedReleaseId)
  const summary = {mode:applying?'apply':'dry-run',target:process.env.WU67_TARGET,mapId:plan.mapId,floors:5,spots:37,categories:6,originalAssets:files.size,previousRelease:before.currentReleaseId,productionUntouched:true}
  if (!applying) { console.log(JSON.stringify({status:'PREFLIGHT_PASS',...summary},null,2));return }
  await mkdir(backup,{recursive:true})
  await writeFile(resolve(backup,'map-before.json'),JSON.stringify(before,null,2),{flag:'wx',mode:0o600})
  await writeFile(resolve(backup,'public-before.json'),JSON.stringify(publicBefore,null,2),{flag:'wx',mode:0o600})
  const oldInvariant = invariant(before,plan.removeQaDecorationIds)
  applied=await prisma.$transaction(async tx=>{
   const check=await getMap(tx);assert.equal(stable(check),stable(before),'Concurrent edit before installation')
   const installed = new Map()
   for(const [sha,spec] of files) {
    const storageKey=`wu67-${sha}.png`;const destination=resolve(process.env.UPLOAD_DIR,storageKey)
    await mkdir(resolve(process.env.UPLOAD_DIR),{recursive:true})
    try { await writeFile(destination,spec.bytes,{flag:'wx'}) }
    catch(e) { if(e.code!=='EEXIST')throw e;assert.equal(digest(await readFile(destination)),sha) }
    let asset=await tx.mediaAsset.findUnique({where:{storageKey}})
    if(asset) { assert.equal(asset.tenantId,before.tenantId);assert.equal(asset.sha256,sha) }
    else asset=await tx.mediaAsset.create({data:{tenantId:before.tenantId,storageKey,originalFilename:`WU67-${basename(spec.file)}`,mimeType:'image/png',width:spec.width,height:spec.height,fileSize:spec.bytes.length,sha256:sha}})
    const processing=await processMediaAsset(tx,asset,process.env.UPLOAD_DIR);assert.equal(processing.status,'READY',`Media processing failed: ${spec.file}`)
    installed.set(sha,asset)
   }
   for(const f of plan.floors) {
    const old=before.floors.find(v=>v.id===f.id),asset=installed.get(f.sha256)
    const result=await tx.mapFloor.updateMany({where:{id:f.id,mapId:plan.mapId,updatedAt:old.updatedAt},data:{illustrationUrl:`/uploads/${asset.storageKey}`,illustrationAssetId:asset.id,imageWidth:f.imageWidth,imageHeight:f.imageHeight}})
    assert.equal(result.count,1,'Concurrent floor edit')
    for(const s of f.spots) {
     const oldSpot=old.spots.find(v=>v.id===s.id)
     const data={x:s.x,y:s.y,liveVersion:{increment:1}}
     if(s.icon) { const icon=installed.get(s.iconSha256);Object.assign(data,{pinSourceMode:'individual',pinIconType:'custom',pinIconId:null,pinIconImageUrl:`/uploads/${icon.storageKey}`,pinIconAssetId:icon.id,pinColor:s.pinColor}) }
     const change=await tx.spot.updateMany({where:{id:s.id,tenantId:before.tenantId,updatedAt:oldSpot.updatedAt,liveVersion:oldSpot.liveVersion},data});assert.equal(change.count,1,'Concurrent Spot edit')
    }
   }
   assert.equal((await tx.floorDecoration.deleteMany({where:{id:{in:plan.removeQaDecorationIds},floorId:plan.floors[0].id}})).count,2)
   const after=await getMap(tx)
   assert.equal(invariant(after,plan.removeQaDecorationIds),oldInvariant,'Unintended data change')
   await appendAuditEvent(tx,{tenantId:before.tenantId,actorUserId:null,action:'WU67_ART_APPLIED',targetType:'Map',targetId:plan.mapId,mapId:plan.mapId,metadata:{executor:'authorized-qa-maintenance',artifactCommit:process.env.WU67_ARTIFACT_COMMIT,sourceGate:'3dc7771',preservedSpots:37,archivedQaDecorations:plan.removeQaDecorationIds}})
   return after
  },{isolationLevel:'Serializable',timeout:180000})
  if(rollbackProbe) throw new Error('EXPECTED_REHEARSAL_FAILURE_AFTER_DRAFT')
  // The required release creator is the existing responsible QA publisher. The independent
  // maintenance audit above identifies automation and does not claim a human approval.
  const actor=before.currentRelease.createdBy
  release=await buildPublicRelease(plan.mapId,actor,process.env.UPLOAD_DIR,storage)
  const ready=JSON.parse(new TextDecoder().decode((await storage.get(release.manifestKey)).bytes)).locales.ja
  assert.equal(publicInvariant(ready),publicInvariant(publicBefore),'Published content/photo/category drift')
  assert.equal(ready.floors.flatMap(f=>f.spots).length,37)
  await activatePublicRelease(plan.mapId,release.id,before.tenantId,actor,storage)
  const current=await loadCurrentPublicSnapshot(plan.slug,'ja',storage);assert.equal(current.releaseId,release.id)
  assert.equal(invariant(await getMap(prisma),plan.removeQaDecorationIds),oldInvariant)
  const report={status:'APPLIED_PASS',...summary,releaseId:release.id,artifactCommit:process.env.WU67_ARTIFACT_COMMIT,immutableContentPreserved:true,oldQaFixtureReleaseRetained:before.currentReleaseId,assets:[...files.values()].map(s=>({file:s.file,sha256:s.sha,width:s.width,height:s.height}))}
  await writeFile(resolve(backup,'installation-report.json'),JSON.stringify(report,null,2),{flag:'wx'})
  console.log(JSON.stringify(report,null,2))
 }
 catch(error) {
  if(applied) {
   const current=await getMap(prisma)
   if(release&&current.currentReleaseId===release.id) await activatePublicRelease(plan.mapId,before.currentReleaseId,before.tenantId,before.currentRelease.createdBy)
   else assert.equal(current.currentReleaseId,before.currentReleaseId,'P1: unexpected release prevents safe rollback')
   await prisma.$transaction(async tx=>{
    for(const f of before.floors) {
     const after=applied.floors.find(v=>v.id===f.id)
     assert.equal((await tx.mapFloor.updateMany({where:{id:f.id,updatedAt:after.updatedAt},data:pick(f,floorFields)})).count,1,'P1: concurrent floor edit prevents rollback')
     for(const s of f.spots) {
      const changed=after.spots.find(v=>v.id===s.id)
      assert.equal((await tx.spot.updateMany({where:{id:s.id,liveVersion:changed.liveVersion,updatedAt:changed.updatedAt},data:{...pick(s,spotFields),liveVersion:{increment:1}}})).count,1,'P1: concurrent Spot edit prevents rollback')
     }
     for(const d of f.decorations) await tx.floorDecoration.create({data:d})
    }
    await appendAuditEvent(tx,{tenantId:before.tenantId,action:'WU67_ART_ROLLED_BACK',targetType:'Map',targetId:plan.mapId,mapId:plan.mapId,metadata:{reason:'installation-or-publication-validation-failed'}})
   },{timeout:60000})
   assert.equal(invariant(await getMap(prisma),plan.removeQaDecorationIds),invariant(before,plan.removeQaDecorationIds),'P1: rollback content mismatch')
   assert.equal((await loadCurrentPublicSnapshot(plan.slug,'ja')).releaseId,before.currentReleaseId,'P1: rollback pointer mismatch')
   console.error('ROLLBACK_VERIFIED: draft and pointer restored; unused new art media may remain for normal media lifecycle management.')
  }
  throw error
 }
 finally { await prisma.$disconnect() }
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
