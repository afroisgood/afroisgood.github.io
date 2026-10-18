// 產生後台密碼的雜湊值，貼進 `npx wrangler secret put ADMIN_PASSWORD_HASH`
// 用法：npm run hash-password（輸入時畫面不會顯示密碼）
import { createInterface } from 'node:readline';
import { hashPassword } from '../src/auth.js';

const ask = (question) => new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    rl._writeToOutput = (text) => { if (text.includes(question)) process.stderr.write(text); };
    rl.question(question, (answer) => { rl.close(); process.stderr.write('\n'); resolve(answer); });
});

const password = await ask('請輸入後台密碼：');
if (password.length < 12) {
    console.error('密碼至少要 12 個字元');
    process.exit(1);
}
if (password !== await ask('再輸入一次：')) {
    console.error('兩次輸入不一樣');
    process.exit(1);
}

console.error('\n把下面這一整行貼到 `npx wrangler secret put ADMIN_PASSWORD_HASH`：\n');
console.log(await hashPassword(password));
