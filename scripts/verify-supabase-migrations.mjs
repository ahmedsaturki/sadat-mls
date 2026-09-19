import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dir = resolve(root, "supabase/migrations");
const expected = [
  { version: "20260814163031", name: "initial_aqarat_os_schema", md5: "4a4c7c967b5cfcc0608055d7aa00e046" },
  { version: "20260814163330", name: "add_intake_and_queue_contracts", md5: "ee5723a63a96b4d8e78bf09533f9c6bf" },
  { version: "20260814164224", name: "add_intake_commit_function", md5: "4fc677417d98c3da00a6d9579be0e12d" },
  { version: "20260814164241", name: "fix_intake_commit_relationship_type", md5: "fb519d659b1ff6d07cbe3f026a9d8249" },
  { version: "20260814164306", name: "fix_intake_commit_ambiguous_person_id", md5: "6140671e61763bc4105498d2a013fc40" },
  { version: "20260814164938", name: "harden_jobs_and_projection_queue", md5: "9de12f9f4fd2d583a29a8347a9dbd6bf" },
  { version: "20260814164944", name: "add_job_claim_and_projection_workers", md5: "c6f4793d4e860453362dee7e55e9c5cf" },
  { version: "20260814180502", name: "harden_functions_and_job_fk_indexes", md5: "c9a2dbf10fcc7583dda436a932ddb1e8" },
  { version: "20260814202250", name: "add_discovery_core_contracts", md5: "77a6c671b67d7ab111d27dc0302eef66" },
  { version: "20260814204337", name: "add_intelligence_content_review_contracts", md5: "58bd77a82a2b41dc7ab84902641c00e4" },
  { version: "20260814232012", name: "add_fk_indexes_for_discovery_and_publication", md5: "fd6a1e4554c0dfda1ce8cf5a9db9be81" },
  { version: "20260814232755", name: "complete_discovery_job_result_fields", md5: "b96633df37a7ffa98156d695bfd8eb48" },
  { version: "20260814233323", name: "make_discovery_entity_natural_key_upsertable", md5: "0dca3dc47df940db48d1c245dfa0ddf6" },
  { version: "20260815001629", name: "harden_intake_property_identity", md5: "96e7269f85783b00314feccec83e467d" },
  { version: "20260815001714", name: "fix_intake_dedup_and_numeric_parsing", md5: "d0d1ed5b102bb4fb9641a61d870b0bb2" },
  { version: "20260815001756", name: "repair_duplicate_sadat_land_intake", md5: "c627b71da6b61ab99058670c5de4e8ea" },
  { version: "20260815001813", name: "add_job_idempotency_unique_index", md5: "93cf8a229ccddb041e5e70e90931e799" },
  { version: "20260815001829", name: "add_sync_projection_unique_index", md5: "737a225cc2d70033ccb1d88d13650999" },
  { version: "20260815004002", name: "security_deny_policies_and_index_cleanup", md5: "5da21ccfb2850ad4e35988d4ba3b3ad9" },
  { version: "20260815004049", name: "add_canonical_property_projection_metadata", md5: "ac93a5d5310764df7e8a299e559cd163" },
  { version: "20260815004645", name: "add_property_resolution_and_lead_scoring", md5: "586bafdda2bed8c54211ca1fd5a7a7ce" },
  { version: "20260815004742", name: "fix_lead_score_and_property_match_functions", md5: "aad819296838f2572d7e2d9d12dc3294" },
  { version: "20260815033252", name: "add_market_graph_interactions_and_content_analytics", md5: "9665f56d2f7487dc9306f44c6e238927" },
  { version: "20260815110409", name: "add_discovery_entity_materializer", md5: "60a0705cca33a69e3566e2039ec81c9a" },
  { version: "20260815133522", name: "add_release_governance_audit_and_source_permission_evidence", md5: "31dd2be330294a798224a5e7351ed568" },
  { version: "20260815141109", name: "enforce_discovery_permissions_and_dashboard_audit", md5: "9e30ccc32a542abfbaa0109d461ae46a" },
  { version: "20260815141321", name: "lock_dashboard_apply_action", md5: "7410b3f4e652d2be05328aa8834ec428" },
  { version: "20260815172822", name: "add_marketing_experiment_fk_indexes", md5: "7575466d997228bd60c4a8b0e80ca956" },
  { version: "20260815200154", name: "harden_sensitive_table_rls", md5: "8b00438369432257c52468757a7bc3db" },
  { version: "20260815214441", name: "cleanup_duplicate_discovery_policies", md5: "9313bbefaef2652081155372ba0ac9de" },
  { version: "20260915182316", name: "add_shared_rate_limit_state", md5: "8262cda99a5de07e1aca5c41b2c8b1ca" },
  { version: "20260915182423", name: "add_aqarat_security_rate_limit_primitive", md5: "d445b9bcd15bb29e817dee6e6d0e1f04" },
  { version: "20260918152055", name: "public_property_read_contract", md5: "f6503fee2fa073b2ba2ad9b60fd8a7b9" },
  { version: "20260918153026", name: "revoke_public_internal_table_grants", md5: "02b65e55495e0a2692808f8ae6e0127e" },
  { version: "20260918171525", name: "fix_discovery_entity_materializer_city_match", md5: "62fbbbd744e6671c49e5cda251b88df5" },
  { version: "20260918171609", name: "fix_discovery_entity_materializer_city_ambiguity", md5: "e4b461c6711a5fb653e42cb9c9e9e9a1" },
  { version: "20260918171635", name: "finalize_discovery_entity_materializer_city_fix", md5: "66ccad83a6484005ae2f585d4420ffbc" },
  { version: "20260918171654", name: "finalize_discovery_entity_materializer_type_and_city_fix", md5: "ecf1e1eb006491345715b87a2cc0ba5d" },
  { version: "20260918171748", name: "finalize_discovery_entity_materializer_provenance", md5: "0712438f726c6cce57abbec60a62b745" },
  { version: "20260918171809", name: "finalize_discovery_entity_materializer_provenance_source", md5: "213221086bbf22d502289ddcf3838e31" },
  { version: "20260918171827", name: "finalize_discovery_entity_materializer_provenance_select", md5: "a8b2d6e8253bf704bc0864c8b7514a54" },
];

const files = readdirSync(dir)
  .filter((file) => /^\\d{14}_.+\\.sql$/.test(file))
  .sort();

const expectedFiles = expected.map(({ version, name }) => `${version}_${name}.sql`).sort();
const missing = expectedFiles.filter((file) => !files.includes(file));
const unexpected = files.filter((file) => !expectedFiles.includes(file));
const mismatched = [];

for (const entry of expected) {
  const file = resolve(dir, `${entry.version}_${entry.name}.sql`);
  const actual = createHash("md5").update(readFileSync(file)).digest("hex");
  if (actual !== entry.md5) {
    mismatched.push({ file: file.replace(root + "/", ""), expected: entry.md5, actual });
  }
}

if (missing.length || unexpected.length || mismatched.length) {
  console.error("SUPABASE_MIGRATION_LEDGER_DRIFT");
  if (missing.length) console.error(`Missing: ${missing.join(", ")}`);
  if (unexpected.length) console.error(`Unexpected: ${unexpected.join(", ")}`);
  if (mismatched.length) console.error(JSON.stringify(mismatched, null, 2));
  process.exit(1);
}

console.log(`SUPABASE_MIGRATION_LEDGER_MATCH: ${expected.length} production-recorded migrations`);
