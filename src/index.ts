import 'dotenv/config';
import { getUserInput } from './cli';
import { generateRoutine } from './claude';
import { saveRoutine } from './db';
import {
  displayWelcome,
  displayUserInfo,
  displayGenerating,
  displayRoutine,
  displayError,
} from './display';

async function main() {
  displayWelcome();

  try {
    const userInput = await getUserInput();
    displayUserInfo(userInput);

    displayGenerating();
    const routine = await generateRoutine(userInput);

    const savedId = saveRoutine(userInput, routine);
    displayRoutine(routine, savedId);
  } catch (error) {
    displayError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    process.exit(1);
  }
}

main();
