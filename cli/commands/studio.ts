import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const studioCommand = new Command('studio')
  .description('Launch the OPO Studio UI locally (like n8n or Flowise)')
  .option('-p, --port <port>', 'Port to run the studio on', '3000')
  .action(async (options) => {
    console.log(chalk.blue(`\n🚀 Starting OPO Studio locally on port ${options.port}...\n`));
    
    try {
      const userCwd = process.cwd();
      
      // Dynamic search for OPO project root directory containing the Next.js app
      let rootDir = __dirname;
      while (rootDir !== path.dirname(rootDir)) {
        if (fs.existsSync(path.join(rootDir, 'app')) && fs.existsSync(path.join(rootDir, 'package.json'))) {
          break;
        }
        rootDir = path.dirname(rootDir);
      }

      const isProd = process.env.NODE_ENV === 'production';
      const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
      
      // Execute the local next binary directly under the root directory context
      const command = isProd ? `node "${nextBin}" start -p ${options.port}` : `node "${nextBin}" dev -p ${options.port}`;
      
      console.log(chalk.gray(`> Project Root: ${rootDir}`));
      console.log(chalk.gray(`> Workspace directory: ${userCwd}`));
      console.log(chalk.gray(`> ${command}`));
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: rootDir,
        env: {
          ...process.env,
          OPO_WORKSPACE_DIR: userCwd
        }
      });
    } catch (error) {
      console.log(chalk.red('\n❌ Failed to start OPO Studio.'));
      process.exit(1);
    }
  });
