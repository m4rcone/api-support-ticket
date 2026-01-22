import { exec } from 'node:child_process';

process.stdout.write('\n🔴 Aguardando o postgres aceitar conexões.');

checkPostgres();

function checkPostgres() {
  exec(
    'docker exec db-dev-support-ticket pg_isready --host localhost',
    (_error, stdout) => {
      if (stdout.includes('accepting connections')) {
        console.log('\n🟢 Postgres pronto e aceitando conexões!\n');
        return;
      }
      process.stdout.write('.');
      checkPostgres();
    },
  );
}
