import chalk from 'chalk';
import { WorkoutRoutine, UserInput } from './types';

export function displayWelcome() {
  console.log('\n' + chalk.bgBlue.white.bold('  AI 운동 루틴 생성기  ') + '\n');
}

export function displayUserInfo(userInput: UserInput) {
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.yellow.bold('[ 입력 정보 ]'));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(`  ${chalk.gray('목표    :')} ${chalk.green.bold(userInput.goal)}`);
  console.log(`  ${chalk.gray('수준    :')} ${chalk.green.bold(userInput.experience)}`);
  console.log(`  ${chalk.gray('운동 일수:')} ${chalk.green.bold(userInput.days_per_week + '일/주')}`);
  console.log('');
}

export function displayGenerating() {
  console.log(chalk.yellow('Claude AI가 운동 루틴을 생성 중입니다...'));
  console.log(chalk.gray('잠시 기다려주세요\n'));
}

export function displayRoutine(routine: WorkoutRoutine, savedId: number) {
  console.log('\n' + chalk.bgGreen.black.bold(` 운동 루틴 생성 완료! (저장 ID: ${savedId}) `) + '\n');

  console.log(chalk.cyan('━'.repeat(62)));
  console.log(chalk.white.bold(`  분할 방식: ${chalk.yellow(routine.split_type)}`));
  console.log(chalk.cyan('━'.repeat(62)));

  for (const day of routine.days) {
    console.log('');
    console.log(chalk.bgYellow.black.bold(` ${day.day_name} `));
    console.log('');

    console.log(
      '  ' +
      chalk.blue.bold(padKo('운동명', 22)) +
      chalk.blue.bold(padKo('세트', 8)) +
      chalk.blue.bold(padKo('반복', 8)) +
      chalk.blue.bold(padKo('휴식', 8))
    );
    console.log('  ' + chalk.gray('─'.repeat(46)));

    for (const ex of day.exercises) {
      console.log(
        '  ' +
        chalk.white(padKo(ex.name, 22)) +
        chalk.green(padKo(ex.sets + '세트', 8)) +
        chalk.cyan(padKo(ex.reps + '회', 8)) +
        chalk.yellow(padKo(ex.rest_seconds + '초', 8))
      );
    }
  }

  console.log('');
  console.log(chalk.cyan('━'.repeat(62)));
  console.log(chalk.green(`  루틴이 데이터베이스에 저장되었습니다. (ID: ${savedId})`));
  console.log(chalk.cyan('━'.repeat(62)) + '\n');
}

function padKo(str: string, length: number): string {
  let displayLen = 0;
  for (const ch of str) {
    displayLen += ch.charCodeAt(0) > 0x007f ? 2 : 1;
  }
  return str + ' '.repeat(Math.max(0, length - displayLen));
}

export function displayError(message: string) {
  console.error('\n' + chalk.red('오류: ' + message));
}
