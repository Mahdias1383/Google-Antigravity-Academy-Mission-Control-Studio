import { auditDirectoryCompliance } from './repositoryAudit';

async function main() {
  console.log('🔍 Executing strict domain whitelist and anti-contamination audit...');
  const report = await auditDirectoryCompliance();

  if (!report.isCompliant) {
    console.error('❌ Domain file structure audit FAILED!');
    console.error(`Found ${report.flaggedIssuesCount} cross-project or non-whitelisted issue(s):`);
    for (const issue of report.issues) {
      console.error(`  - [${issue.severity.toUpperCase()}] ${issue.filePath}: ${issue.reasonEn}`);
    }
    process.exit(1);
  }

  console.log(`✅ Domain file structure audit PASSED!`);
  console.log(`   Audited Domain: ${report.auditedDomain}`);
  console.log(`   Compliant files verified: ${report.validFilesCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
